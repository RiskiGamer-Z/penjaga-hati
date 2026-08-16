"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { submitBookingAction } from "@/features/booking/actions";
import { getBookingDataAction } from "./fetch-actions";
import { toast } from "@/utils/toast";
import PageLoader from "@/components/ui/PageLoader";
import { compressImage } from "@/utils/imageCompression";

import BookingStepIndicator from "./components/BookingStepIndicator";
import PatientDetailsStep from "./components/PatientDetailsStep";
import SchedulePackageStep from "./components/SchedulePackageStep";
import PaymentConfirmationStep from "./components/PaymentConfirmationStep";
import BookingSummary from "./components/BookingSummary";

export default function BookingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [mitras, setMitras] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    hospitalId: "",
    roomNumber: "",
    diagnosis: "",
    specialNotes: "",
    mitraGender: "",
    mitraId: "",
    packageId: "",
    durationHours: "",
    startDate: "",
    startTime: "",
    paymentProof: null as File | null,
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?next=/booking');
        return;
      }

      try {
        const bookingData = await getBookingDataAction();
        setHospitals(bookingData.hospitals || []);
        setMitras(bookingData.mitras || []);
        setPackages(bookingData.packages || []);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        toast.error("Gagal Memuat Data", "Tidak dapat memuat data pemesanan. Silakan muat ulang halaman.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router, supabase]);

  const getPackagePrice = () => {
    if (!formData.packageId) return 0;
    const selectedPkg = packages.find(p => p.id === formData.packageId);
    if (!selectedPkg) return 0;
    return Number(selectedPkg.base_price ?? selectedPkg.price_per_unit ?? 0);
  };

  const filteredMitras = useMemo(() => {
    if (!formData.mitraGender) return mitras;
    return mitras.filter(m => m.gender === formData.mitraGender || !m.gender);
  }, [formData.mitraGender, mitras]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'packageId') {
      const selectedPkg = packages.find(p => p.id === value);
      const duration = selectedPkg ? selectedPkg.duration_hours?.toString() || "" : "";
      setFormData(prev => ({
        ...prev,
        packageId: value,
        durationHours: duration
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Kompres gambar (PDF dilewati otomatis) agar hemat ruang penyimpanan
      const compressed = await compressImage(e.target.files[0]);
      setFormData({ ...formData, paymentProof: compressed });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login kembali.");

      if (!formData.hospitalId || !formData.mitraId || !formData.packageId) {
        throw new Error("Mohon lengkapi seluruh data pemesanan.");
      }

      let paymentProofUrl = null;

      if (formData.paymentProof) {
        const fileExt = formData.paymentProof.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, formData.paymentProof);

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);
          paymentProofUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Upload bukti bayar gagal, melanjutkan submit pesanan:", uploadError);
        }
      }

      const actionData = {
        mitraId: formData.mitraId,
        hospitalId: formData.hospitalId,
        packageId: formData.packageId,
        patientName: formData.patientName,
        patientAge: parseInt(formData.patientAge) || 0,
        roomNumber: formData.roomNumber,
        diagnosis: formData.diagnosis,
        specialNotes: formData.specialNotes,
        durationHours: parseInt(formData.durationHours) || 0,
        startDate: formData.startDate,
        startTime: formData.startTime,
      };

      const result = await submitBookingAction(actionData, paymentProofUrl);

      if (result.success) {
        toast.success("Pesanan Berhasil Dikirim!", "Admin dan Mitra Penjaga Hati akan segera memproses.");
        router.push(`/user/orders/${result.orderId}`);
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      toast.error("Terjadi Kesalahan", error.message || "Gagal mengirim pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label="Menyiapkan formulir pemesanan" />;
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-28 pb-24 bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-4 md:px-8 gap-8">

          <BookingStepIndicator step={step} />

          <div className="flex flex-col lg:flex-row w-full gap-8">
            <div className="flex flex-col grow rounded-3xl bg-white border border-indigo-100 p-6 md:p-10 shadow-sm">
              {step === 1 && (
                <PatientDetailsStep 
                  formData={formData}
                  handleChange={handleChange}
                  hospitals={hospitals}
                  handleNext={handleNext}
                />
              )}

              {step === 2 && (
                <SchedulePackageStep 
                  formData={formData}
                  handleChange={handleChange}
                  filteredMitras={filteredMitras}
                  packages={packages}
                  handlePrev={handlePrev}
                  handleNext={handleNext}
                />
              )}

              {step === 3 && (
                <PaymentConfirmationStep 
                  formData={formData as any}
                  hospitals={hospitals}
                  mitras={mitras}
                  packages={packages}
                  handleFileChange={handleFileChange}
                  handlePrev={handlePrev}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>

            <BookingSummary 
              formData={formData}
              hospitals={hospitals}
              mitras={mitras}
              packages={packages}
              getPackagePrice={getPackagePrice}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
