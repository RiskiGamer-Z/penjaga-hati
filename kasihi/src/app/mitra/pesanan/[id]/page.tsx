"use client";

import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle, Phone, FileText, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import { useRouter } from "next/navigation";
import AcceptOrderButton from "@/components/actions/mitra/AcceptOrderButton";
import RejectOrderButton from "@/components/actions/mitra/RejectOrderButton";
import StartTransitButton from "@/components/actions/mitra/StartTransitButton";
import ArriveAtLocationButton from "@/components/actions/mitra/ArriveAtLocationButton";
import StartServiceButton from "@/components/actions/mitra/StartServiceButton";
import CompleteServiceButton from "@/components/actions/mitra/CompleteServiceButton";
import { 
  getMitraOrderDetailAction, 
  updateOrderStatusAction 
} from "../actions";

export default function MitraOrderDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [mitra, setMitra] = useState<any>(null);
  const [processingAction, setProcessingAction] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu.");
        router.push("/auth/login");
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'mitra') {
        toast.error("Akses ditolak. Halaman ini khusus untuk Mitra.");
        router.push("/auth/login");
        return;
      }

      // 2. Get mitra details
      const { data: mitraData } = await supabase
        .from('mitras')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!mitraData) {
        toast.error("Profil mitra tidak ditemukan.");
        return;
      }
      setMitra(mitraData);

      // 3. Fetch order detail
      const res = await getMitraOrderDetailAction(params.id, mitraData.id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        toast.error(res.error || "Pesanan tidak ditemukan.");
      }
    } catch (err: any) {
      toast.error("Gagal mengambil data detail pesanan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);


  const handleStatusTransition = async (newStatus: 'in_transit' | 'arrived' | 'in_progress' | 'completed' | 'service_done') => {
    setProcessingAction(true);
    try {
      const res = await updateOrderStatusAction(order.id, mitra.id, newStatus);
      if (res.success) {
        toast.success(`Status pesanan berhasil diperbarui.`);
        await fetchOrderDetail();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Gagal memperbarui status pesanan.");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string, cls: string }> = {
      pending_payment: { label: "Menunggu Pembayaran", cls: "bg-blue-50 text-blue-600 border-blue-100" },
      waiting_mitra: { label: "Menunggu Mitra", cls: "bg-orange-50 text-orange-600 border-orange-100" },
      accepted: { label: "Diterima", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
      in_transit: { label: "Dalam Perjalanan", cls: "bg-amber-50 text-amber-600 border-amber-100" },
      arrived: { label: "Tiba di Lokasi", cls: "bg-sky-50 text-sky-600 border-sky-100" },
      in_progress: { label: "Sedang Didampingi", cls: "bg-purple-50 text-purple-600 border-purple-100" },
      service_done: { label: "Menunggu Konfirmasi User", cls: "bg-purple-50 text-purple-600 border-purple-100" },
      completed: { label: "Selesai", cls: "bg-emerald-50 text-brand-evergreen border-emerald-100" },
      cancelled: { label: "Dibatalkan", cls: "bg-red-50 text-red-600 border-red-100" }
    };
    const badge = badges[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-100" };
    return (
      <span className={`rounded-md py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}>
        {badge.label}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-20 text-brand-evergreen h-full">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-semibold animate-pulse">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-20 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-brand-navy">Pesanan Tidak Ditemukan</h1>
        <p className="text-gray-500 mt-2">Pesanan tidak terdaftar atau Anda tidak memiliki akses ke pesanan ini.</p>
        <Link href="/mitra/dashboard" className="mt-6 text-brand-evergreen font-bold">Kembali ke Dashboard</Link>
      </div>
    );
  }

  const durationHours = order.service_packages?.duration_hours || 0;
  const basePrice = order.service_packages?.base_price || 0;
  const adminCommission = basePrice * 0.15;
  const netEarnings = basePrice - adminCommission;

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Back Button */}
        <Link href="/mitra/dashboard" className="flex items-center gap-3 w-fit group">
          <div className="flex items-center justify-center rounded-xl bg-white border border-gray-200 w-10 h-10 group-hover:bg-gray-50 group-hover:border-gray-300 transition-all shadow-sm">
            <ArrowLeft size={18} className="text-gray-600 group-hover:text-brand-navy transition-colors" />
          </div>
          <span className="font-semibold text-gray-600 group-hover:text-brand-navy text-sm transition-colors">
            Kembali ke Dashboard
          </span>
        </Link>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
               <h1 className="font-black text-brand-navy text-2xl tracking-tight">Detail Pesanan #{order.id.slice(0, 8).toUpperCase()}</h1>
               {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock size={14} />
              <span>Dipesan pada: {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
            </div>
          </div>
          
          {/* Dynamic Action Buttons based on Status */}
          <div className="flex gap-3 shrink-0">
            {processingAction ? (
              <div className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl bg-gray-50">
                <Loader2 size={16} className="animate-spin text-brand-evergreen" />
                <span className="text-sm text-gray-500 font-semibold">Memproses...</span>
              </div>
            ) : (
              <>
                {order.status === 'waiting_mitra' && (
                  <>
                    <RejectOrderButton
                      orderId={order.id}
                      mitraId={mitra.id}
                      onSuccess={async () => {
                        router.push("/mitra/pesanan");
                      }}
                    />
                    <AcceptOrderButton
                      orderId={order.id}
                      mitraId={mitra.id}
                      onSuccess={fetchOrderDetail}
                    />
                  </>
                )}
                {order.status === 'accepted' && (
                  <StartTransitButton
                    orderId={order.id}
                    mitraId={mitra.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
                {order.status === 'in_transit' && (
                  <ArriveAtLocationButton
                    orderId={order.id}
                    mitraId={mitra.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
                {order.status === 'arrived' && (
                  <StartServiceButton
                    orderId={order.id}
                    mitraId={mitra.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
                {order.status === 'in_progress' && (
                  <CompleteServiceButton
                    orderId={order.id}
                    mitraId={mitra.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
                {order.status === 'service_done' && (
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm py-2 px-4 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                    <CheckCircle2 size={16} />
                    <span>Menunggu Konfirmasi User</span>
                  </div>
                )}
                {order.status === 'completed' && (
                  <div className="flex items-center gap-2 text-brand-evergreen font-bold text-sm py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={16} />
                    <span>Pendampingan Selesai</span>
                  </div>
                )}
                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-2 text-red-500 font-bold text-sm py-2 px-4 bg-red-50 rounded-xl border border-red-100 shadow-sm">
                    <AlertCircle size={16} />
                    <span>Pesanan Dibatalkan</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Info Pendampingan & Pasien) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Informasi Pendampingan */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="py-5 px-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-bold text-brand-navy text-lg flex items-center gap-2">
                   <FileText size={20} className="text-brand-evergreen" />
                   Informasi Pendampingan
                </h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center shrink-0 rounded-xl bg-emerald-50 text-brand-evergreen w-12 h-12 shadow-inner">
                      <Calendar size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-500 text-xs uppercase tracking-wider">Tanggal Mulai</span>
                      <span className="font-bold text-brand-navy text-base">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center shrink-0 rounded-xl bg-orange-50 text-brand-alpine w-12 h-12 shadow-inner">
                      <Clock size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-500 text-xs uppercase tracking-wider">Durasi Layanan</span>
                      <span className="font-bold text-brand-navy text-base">
                        {order.service_packages?.name} ({durationHours} Jam)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full h-px bg-gray-100" />
                
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center shrink-0 rounded-xl bg-blue-50 text-blue-600 w-12 h-12 shadow-inner">
                    <MapPin size={20} />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <span className="font-medium text-gray-500 text-xs uppercase tracking-wider">Lokasi Rumah Sakit</span>
                    <span className="font-bold text-brand-navy text-base">{order.hospitals?.name || "Rawat Rumah / Mandiri"}</span>
                    {order.hospitals?.address && (
                      <span className="text-gray-600 text-sm bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-200 mt-1 max-w-lg leading-relaxed">
                        {order.hospitals.address} {order.hospitals.city ? `, ${order.hospitals.city}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Pasien */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="py-5 px-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-bold text-brand-navy text-lg flex items-center gap-2">
                   <User size={20} className="text-brand-alpine" />
                   Profil Pasien
                </h2>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-5 border-b border-gray-100 border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 text-xs font-medium uppercase">Nama Pasien</span>
                    <span className="font-bold text-brand-navy text-sm">{order.patient_name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 text-xs font-medium uppercase">Usia</span>
                    <span className="font-bold text-brand-navy text-sm">{order.patient_age} Tahun</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 text-xs font-medium uppercase">Status</span>
                    <span className="font-bold text-brand-navy text-sm">Aktif</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-gray-500 text-xs font-medium uppercase">Kondisi Umum / Catatan Khusus</span>
                  <div className="rounded-xl p-4 bg-yellow-50/50 border border-yellow-100/50">
                    <p className="text-brand-navy text-[13.5px] leading-relaxed">
                      {order.patient_condition || "Tidak ada catatan kondisi khusus yang diberikan."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Pendapatan & Pemesan) */}
          <div className="flex flex-col gap-6">
            
            {/* Estimasi Pendapatan */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="py-4 px-6 border-b border-gray-100 bg-emerald-50/30">
                <h2 className="font-bold text-brand-navy text-base">Estimasi Pendapatan</h2>
              </div>
              <div className="p-6 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500 text-sm font-medium">Harga Layanan</span>
                   <span className="font-bold text-brand-navy text-sm">{formatPrice(basePrice)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs text-gray-400">
                   <span>Potongan platform (15%)</span>
                   <span>- {formatPrice(adminCommission)}</span>
                 </div>
                 <div className="w-full h-px bg-gray-100 my-1" />
                 <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                       <span className="font-bold text-brand-navy text-sm">Pendapatan Bersih</span>
                    </div>
                    <span className="font-black text-brand-evergreen text-xl tracking-tight">{formatPrice(netEarnings)}</span>
                 </div>
              </div>
            </div>

            {/* Info Pemesan & Kontak */}
            {(() => {
              const clientProfile = order.users ? (Array.isArray(order.users) ? order.users[0] : order.users) : null;
              if (!clientProfile) return null;
              return (
                <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <div className="py-4 px-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-brand-navy text-base">Kontak Pemesan</h2>
                  </div>
                  <div className="p-6 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-lg shadow-inner">
                         {clientProfile.full_name ? clientProfile.full_name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                         <span className="font-bold text-brand-navy text-base">{clientProfile.full_name}</span>
                         <span className="text-gray-500 text-xs font-medium">Klien Kasihi</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {clientProfile.phone ? (
                        <a 
                          href={`https://wa.me/${clientProfile.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + clientProfile.phone.replace(/[^0-9]/g, '').slice(1) : clientProfile.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(clientProfile.full_name)},%20saya%20mitra%20pendamping%20dari%20Kasihi%20untuk%20pesanan%20%23${order.order_number}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-50 hover:border-gray-200 transition-all text-center"
                        >
                           <MessageCircle size={16} />
                           Kirim WA
                        </a>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => toast.warning("Nomor WhatsApp pemesan tidak tersedia.")}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-bold text-xs cursor-pointer text-center"
                        >
                           <MessageCircle size={16} />
                           Kirim WA (Kosong)
                        </button>
                      )}

                      {clientProfile.phone ? (
                        <a 
                          href={`tel:${clientProfile.phone}`}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-brand-evergreen text-brand-evergreen font-bold text-xs hover:bg-emerald-50 transition-all text-center"
                        >
                           <Phone size={16} />
                           Telepon
                        </a>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => toast.warning("Nomor telepon pemesan tidak tersedia.")}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-brand-evergreen/30 text-brand-evergreen/40 font-bold text-xs cursor-pointer text-center"
                        >
                           <Phone size={16} />
                           Telepon (Kosong)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
  );
}
