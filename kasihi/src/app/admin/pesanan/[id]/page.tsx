"use client";

import { use, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Hospital as HospitalIcon, 
  Package as PackageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/utils/toast";
import { createClient } from "@/utils/supabase/client";
import AssignMitraButton from "@/components/actions/admin/AssignMitraButton";
import CompleteOrderButton from "@/components/actions/admin/CompleteOrderButton";
import CancelOrderButton from "@/components/actions/admin/CancelOrderButton";
import { fetchAdminOrderDetailAction, fetchAvailableMitrasAction, markOrderAsViewedAction } from "../actions";

export default function OrderDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const orderId = params.id;
  
  const [order, setOrder] = useState<any>(null);
  const [availableMitras, setAvailableMitras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReassigning, setIsReassigning] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      // 1. Fetch Order Data
      const orderRes = await fetchAdminOrderDetailAction(orderId);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error || "Pesanan tidak ditemukan");
      }
      setOrder(orderRes.data);
      await markOrderAsViewedAction(orderId);
      setIsReassigning(false);

      // 2. Fetch Available Mitras (Verified ones)
      const mitrasRes = await fetchAvailableMitrasAction();
      if (mitrasRes.success && mitrasRes.data) {
        setAvailableMitras(mitrasRes.data);
      }
    } catch (err: any) {
      toast.error("Gagal Memuat Detail", "Detail pesanan gagal dimuat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();

    // Subscribe to real-time updates for this order
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-order-detail-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        () => {
          fetchOrderDetail();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-evergreen" />
        <p className="font-medium text-gray-500">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Pesanan tidak ditemukan.</p>
        <Link href="/admin/pesanan" className="text-brand-evergreen hover:underline mt-4 inline-block">Kembali ke Daftar</Link>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Menunggu Pembayaran', color: 'bg-gray-100 text-gray-600', icon: Clock };
      case 'waiting_mitra':
        return { label: 'Butuh Assign Mitra', color: 'bg-orange-100 text-orange-600', icon: AlertCircle };
      case 'accepted':
        return { label: 'Diterima Mitra', color: 'bg-indigo-100 text-indigo-600', icon: CheckCircle2 };
      case 'in_transit':
        return { label: 'Transit ke Lokasi', color: 'bg-amber-100 text-amber-600', icon: Clock };
      case 'arrived':
        return { label: 'Mitra Tiba', color: 'bg-sky-100 text-sky-600', icon: CheckCircle2 };
      case 'in_progress':
        return { label: 'Sedang Berlangsung', color: 'bg-blue-100 text-blue-600', icon: Calendar };
      case 'service_done':
        return { label: 'Konfirmasi Selesai', color: 'bg-purple-100 text-purple-600', icon: CheckCircle2 };
      case 'completed':
        return { label: 'Selesai', color: 'bg-emerald-100 text-brand-evergreen', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Dibatalkan', color: 'bg-red-100 text-red-600', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const paymentData = order.payments;
  const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null;

  return (
    <div className="flex flex-col flex-1 p-8 gap-8 bg-gray-50/50">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/pesanan" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy transition-colors font-medium">
          <ArrowLeft size={18} />
          <span>Daftar Pesanan</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`flex items-center px-4 py-2 rounded-full gap-2 ${statusInfo.color}`}>
            <statusInfo.icon size={16} />
            <span className="text-sm font-bold">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Order & Patient Details */}
        <div className="col-span-8 flex flex-col gap-8">
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">ID Pesanan</span>
                  <h1 className="text-2xl font-black text-brand-navy">#{order.id.slice(0, 8).toUpperCase()}</h1>
                </div>
                <div className="text-right">
                   <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Tanggal Pesan</span>
                   <p className="font-bold text-brand-navy">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-2 gap-12">
              {/* Patient Info */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-evergreen">
                    <User size={20} />
                  </div>
                  <h3 className="font-bold text-brand-navy">Informasi Pasien</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Nama Pasien</span>
                    <p className="font-semibold text-brand-navy">{order.patient_name} ({order.patient_age || '-'} Tahun)</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Kondisi Pasien</span>
                    <p className="text-gray-600 text-sm leading-relaxed">{order.patient_condition || 'Tidak ada catatan kondisi.'}</p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-evergreen">
                    <HospitalIcon size={20} />
                  </div>
                  <h3 className="font-bold text-brand-navy">Detail Layanan</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HospitalIcon size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none mb-1">Rumah Sakit</span>
                      <p className="font-semibold text-brand-navy text-sm">{order.hospitals?.name}</p>
                      {order.hospitals?.address && (
                        <p className="text-xs text-gray-500 mt-1 leading-normal">{order.hospitals?.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PackageIcon size={16} className="text-gray-400" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none mb-1">Paket Layanan</span>
                      <p className="font-semibold text-brand-navy text-sm">{order.service_packages?.name} ({order.service_packages?.duration_hours} Jam)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none mb-1">Tanggal Pesan</span>
                      <p className="font-semibold text-brand-navy text-sm">{new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-navy border border-gray-100">
               <User size={32} />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Pemesan</span>
                 <p className="font-bold text-brand-navy">{order.users?.full_name}</p>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Email</span>
                 <p className="font-medium text-gray-600 text-sm">{order.users?.email}</p>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</span>
                 <p className="font-medium text-gray-600 text-sm">{order.users?.phone}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Status */}
        <div className="col-span-4 flex flex-col gap-8">
          {/* Payment Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-brand-evergreen" />
                <h3 className="font-bold text-brand-navy text-sm">Pembayaran</h3>
              </div>
              {payment ? (
                <span className={`text-[10px] font-black uppercase py-1 px-2 rounded-lg ${payment.status === 'verified' ? 'bg-emerald-50 text-brand-evergreen' : 'bg-orange-50 text-brand-alpine'}`}>
                  {payment.status === 'verified' ? 'Lunas' : 'Menunggu'}
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase py-1 px-2 rounded-lg bg-gray-50 text-gray-400">Belum Ada</span>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Tagihan</span>
              <span className="text-2xl font-black text-brand-navy">Rp {(order.total_amount || order.service_packages?.base_price || 0).toLocaleString('id-ID')}</span>
            </div>

            {payment && (payment.bank_name_from || payment.bank_account_name_from || payment.reference_number) && (
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-brand-navy">
                <span className="text-[9px] font-black tracking-wider text-emerald-800 uppercase block leading-none">Detail Transfer</span>
                <div className="space-y-1.5">
                  {payment.bank_name_from && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank Pengirim:</span>
                      <span className="font-bold text-brand-navy">{payment.bank_name_from}</span>
                    </div>
                  )}
                  {payment.bank_account_name_from && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nama Rekening:</span>
                      <span className="font-bold text-brand-navy">{payment.bank_account_name_from}</span>
                    </div>
                  )}
                  {payment.reference_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">No. Referensi:</span>
                      <span className="font-bold text-brand-navy">{payment.reference_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {payment?.status === 'pending' && (
              <Link href="/admin/verifikasi" className="w-full py-3 bg-brand-alpine hover:bg-orange-600 text-white rounded-xl text-center text-sm font-bold transition-colors">
                Periksa Bukti Transfer
              </Link>
            )}
          </div>

          {/* Mitra Assignment Card */}
          <div className="bg-brand-navy rounded-3xl shadow-xl p-8 text-white flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-lg">Penetapan Mitra</h3>
            </div>

            {order.mitras && !isReassigning ? (
              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-brand-evergreen flex items-center justify-center font-black">
                    {order.mitras.users?.full_name?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{order.mitras.users?.full_name}</span>
                    <span className="text-white/40 text-xs">{order.mitras.users?.phone}</span>
                  </div>
                </div>
                <p className="text-white/60 text-xs italic">Mitra telah ditetapkan dan bertugas sesuai jadwal.</p>
                {!['completed', 'service_done', 'cancelled'].includes(order.status) && (
                  <button 
                    onClick={() => setIsReassigning(true)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors text-left"
                  >
                    Ganti Mitra Bertugas?
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 relative z-10 w-full">
                <AssignMitraButton
                  orderId={orderId}
                  availableMitras={availableMitras}
                  onSuccess={fetchOrderDetail}
                />
                {order.mitras && (
                  <button
                    onClick={() => setIsReassigning(false)}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Batal Ganti
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
             <h3 className="font-bold text-brand-navy text-sm">Aksi Cepat</h3>
             <div className="flex flex-col gap-2">
                {order.status === 'service_done' && (
                  <CompleteOrderButton
                    orderId={order.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
                {!['completed', 'service_done', 'cancelled'].includes(order.status) && (
                  <CancelOrderButton
                    orderId={order.id}
                    onSuccess={fetchOrderDetail}
                  />
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
