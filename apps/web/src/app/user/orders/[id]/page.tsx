import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare, Phone, ShieldCheck, FileText, AlertCircle, Clock, Star, Quote } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect, notFound } from "next/navigation";
import ConfirmCompletionButton from "@/components/actions/user/ConfirmCompletionButton";
import ReviewForm from "@/components/actions/user/ReviewForm";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const resolvedParams = await params;
  const orderNumber = resolvedParams.id;

  // 1. Cek User Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber);

  // 2. Fetch Data Order — menggunakan admin client untuk bypass RLS (terutama service_packages dan mitras)
  const { data: order, error } = await adminSupabase
    .from('orders')
    .select(`
      id,
      order_number,
      user_id,
      patient_name,
      patient_age,
      patient_condition,
      status,
      created_at,
      hospitals (name, city),
      mitras (
        id,
        average_rating,
        users (full_name, phone)
      ),
      service_packages (name, duration_hours, base_price),
      payments (id, status, proof_of_transfer_url, amount, created_at),
      order_timeline (event_type, status_after, created_at),
      reviews (id, rating, comment, admin_response, admin_response_at, created_at)
    `)
    .eq(isUUID ? 'id' : 'order_number', orderNumber)
    .single();

  // Verifikasi manual kepemilikan pesanan
  if (error || !order || order.user_id !== user.id) {
    console.error("[OrderDetailPage ERROR]:", {
      hasError: !!error,
      errorMsg: error?.message,
      hasOrder: !!order,
      orderUserId: order?.user_id,
      authUserId: user.id,
      orderNumber
    });
    notFound();
  }

  // Hitung status untuk Tracker
  // Hitung status untuk Tracker (enum: pending_payment, waiting_mitra, in_progress, completed, cancelled)
  const payment = Array.isArray(order.payments) ? order.payments[0] : (order.payments || null);
  const hasProof = !!payment?.proof_of_transfer_url;
  
  const statusFlow = ['pending_payment', 'waiting_mitra', 'in_progress', 'completed'];
  const currentIdx = statusFlow.indexOf(order.status);

  // Status antara setelah pembayaran diverifikasi (mitra sudah ditugaskan & bergerak)
  const postVerifiedStatuses = ['waiting_mitra', 'accepted', 'in_transit', 'arrived', 'in_progress', 'service_done', 'completed'];
  const runningStatuses = ['in_transit', 'arrived', 'in_progress', 'service_done', 'completed'];

  // Jika status pending_payment tapi bukti sudah ada → anggap sudah bayar (menunggu verifikasi)
  const isPaid = postVerifiedStatuses.includes(order.status) || (order.status === 'pending_payment' && hasProof);
  const isVerified = postVerifiedStatuses.includes(order.status); // sudah diverifikasi admin
  const isRunning = runningStatuses.includes(order.status);
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  // Helper formatting waktu
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).replace(',', ' •');
  };

  // Ekstrak timestamp tiap langkah
  const timeDipesan = order.created_at;
  const timeDibayar = payment?.proof_of_transfer_url ? payment.created_at : null;
  const timeline = order.order_timeline || [];
  
  const timeDiverifikasi = timeline.find((t: any) => t.event_type === 'payment_verified')?.created_at;
  const timeBerlangsung = timeline.find((t: any) => t.status_after === 'in_progress')?.created_at;
  const timeSelesai = timeline.find((t: any) => t.status_after === 'completed')?.created_at;

  // Time Ago Helper
  const getTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return 'Baru saja';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)} detik lalu`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  // Hitung Last Updated At
  const lastEvent = timeline.length > 0 
    ? timeline.reduce((latest: any, t: any) => new Date(t.created_at) > new Date(latest.created_at) ? t : latest, timeline[0])
    : null;
    
  let lastUpdatedAt = order.created_at;
  if (payment?.created_at && new Date(payment.created_at) > new Date(lastUpdatedAt)) {
      lastUpdatedAt = payment.created_at;
  }
  if (lastEvent?.created_at && new Date(lastEvent.created_at) > new Date(lastUpdatedAt)) {
      lastUpdatedAt = lastEvent.created_at;
  }

  // Live Update Badge
  const getLiveStatusBadge = () => {
    let dotColor = "bg-orange-500";
    let statusText = "Menunggu Pembayaran";
    let isLive = !isCompleted && !isCancelled;

    if (isCancelled) {
      dotColor = "bg-red-500";
      statusText = "Dibatalkan";
      isLive = false;
    } else if (isCompleted) {
      dotColor = "bg-brand-evergreen";
      statusText = "Selesai";
      isLive = false;
    } else if (order.status === 'service_done') {
      dotColor = "bg-purple-500";
      statusText = "Menunggu Konfirmasi";
    } else if (order.status === 'in_progress') {
      dotColor = "bg-blue-500";
      statusText = "Pendampingan Berlangsung";
    } else if (order.status === 'arrived') {
      dotColor = "bg-blue-500";
      statusText = "Mitra Tiba di Lokasi";
    } else if (order.status === 'in_transit') {
      dotColor = "bg-blue-500";
      statusText = "Mitra Dalam Perjalanan";
    } else if (order.status === 'accepted') {
      dotColor = "bg-orange-500";
      statusText = "Diterima Mitra";
    } else if (isVerified) {
      dotColor = "bg-orange-500";
      statusText = "Menunggu Mitra";
    } else if (isPaid) {
      dotColor = "bg-purple-500";
      statusText = "Menunggu Verifikasi";
    }

    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 p-4 bg-white shadow-sm w-full md:w-auto md:min-w-[280px] relative overflow-hidden">
        {/* Glow effect if live */}
        {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />}
        {!isLive && <div className={`absolute top-0 left-0 w-full h-1 ${isCompleted ? 'bg-brand-evergreen' : 'bg-red-500'}`} />}
        
        <span className="text-[13px] text-gray-500 font-medium">Status saat ini</span>
        
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${dotColor} relative z-10`} />
            {isLive && <div className={`absolute w-3 h-3 rounded-full ${dotColor} animate-ping opacity-75`} />}
          </div>
          <span className="font-bold text-gray-800 text-base">{statusText}</span>
        </div>
        
        <div className="flex items-center justify-between mt-1 border-t border-gray-100 pt-3">
          <span className="text-[12px] text-gray-500">Diperbarui {getTimeAgo(lastUpdatedAt)}</span>
          {isLive && (
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
             </div>
          )}
        </div>
      </div>
    );
  };

  const pkg: any = Array.isArray(order.service_packages) ? order.service_packages[0] : order.service_packages;
  const hospital: any = Array.isArray(order.hospitals) ? order.hospitals[0] : order.hospitals;
  
  const rawMitra: any = Array.isArray(order.mitras) ? order.mitras[0] : order.mitras;
  const rawUser: any = rawMitra ? (Array.isArray(rawMitra.users) ? rawMitra.users[0] : rawMitra.users) : null;
  const mitras = rawMitra ? { ...rawMitra, users: rawUser } : null;
  
  const totalPrice = pkg?.base_price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Top Navigation */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/user/dashboard" className="flex items-center justify-center rounded-[10px] shrink-0 border border-solid border-gray-300 w-9 h-9 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-[#6B7B8D]" />
          </Link>
          <span className="font-medium text-[#6B7B8D] text-sm">
            Kembali ke Dashboard
          </span>
        </div>

        {/* Header Title & Status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 w-full">
          <h1 className="tracking-[-0.02em] font-bold text-brand-navy text-2xl">
            Pesanan #{order.order_number}
          </h1>
          {getLiveStatusBadge()}
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column (Main Info) */}
          <div className="flex flex-col flex-1 gap-6">
            
            {/* Patient Info */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
              <h2 className="font-semibold text-brand-navy text-base mb-5">Informasi Pasien</h2>
              <div className="w-full h-px bg-gray-100 mb-5" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="uppercase tracking-widest font-medium text-[#9CA3AF] text-xs">Nama Pasien</span>
                    <span className="font-medium text-brand-navy text-[15px]">{order.patient_name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase tracking-widest font-medium text-[#9CA3AF] text-xs">Usia</span>
                    <span className="font-medium text-brand-navy text-[15px]">{order.patient_age} Tahun</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="uppercase tracking-widest font-medium text-[#9CA3AF] text-xs">Rumah Sakit</span>
                    <span className="font-medium text-brand-navy text-[15px]">{hospital?.name || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase tracking-widest font-medium text-[#9CA3AF] text-xs">Kota</span>
                    <span className="font-medium text-brand-navy text-[15px]">{hospital?.city || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Kondisi / Catatan */}
              {order.patient_condition && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <span className="uppercase tracking-widest font-medium text-[#9CA3AF] text-xs">Kondisi & Catatan</span>
                  <p className="font-medium text-brand-navy text-[15px] mt-1.5 whitespace-pre-line">{order.patient_condition}</p>
                </div>
              )}
            </div>

            {/* Mitra Info */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
              <h2 className="font-semibold text-brand-navy text-base mb-5">Mitra Pendamping</h2>
              <div className="w-full h-px bg-gray-100 mb-5" />
              
              {mitras?.users?.full_name ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center shrink-0 rounded-full bg-brand-evergreen w-16 h-16 shadow-md">
                      <span className="font-semibold text-white text-[22px]">
                        {mitras.users.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-navy text-[17px]">{mitras.users.full_name}</span>
                        <div className="flex items-center rounded-md py-0.5 px-2 gap-1 bg-emerald-50 border border-emerald-100">
                          <ShieldCheck size={12} className="text-brand-evergreen" />
                          <span className="font-semibold text-brand-evergreen text-[11px]">Terverifikasi</span>
                        </div>
                      </div>
                      <span className="text-[#6B7B8D] text-[13px]">
                        Rating {mitras.average_rating || '5.0'} ⭐
                      </span>
                    </div>
                  </div>
                  
                  <a 
                    href={mitras.users.phone ? `https://wa.me/${mitras.users.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + mitras.users.phone.replace(/[^0-9]/g, '').slice(1) : mitras.users.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(mitras.users.full_name)},%20saya%20pemesan%20layanan%20Penjaga%20Hati%20dengan%20nomor%20pesanan%20${order.order_number}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center rounded-[10px] py-2.5 px-5 gap-2 bg-emerald-50 text-brand-evergreen hover:bg-emerald-100 transition-colors w-full md:w-auto justify-center decoration-none"
                  >
                    <MessageSquare size={16} />
                    <span className="font-semibold text-[13px]">Chat Mitra</span>
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Mitra belum ditentukan</p>
                  <p className="text-gray-400 text-sm">Menunggu konfirmasi admin atau pemilihan mitra</p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            {order.status === 'completed' && mitras?.id && (
              (() => {
                const review = Array.isArray(order.reviews) ? order.reviews[0] : (order.reviews || null);
                if (review) {
                  return (
                    <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
                      <h2 className="font-semibold text-brand-navy text-base mb-4">Ulasan Layanan</h2>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center shrink-0 rounded-full bg-amber-50 border border-amber-200 w-12 h-12">
                          <Star className="text-amber-500 fill-amber-500" size={20} />
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={s <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-xl relative">
                            <Quote className="text-slate-200 absolute -top-2 -left-1 transform -scale-x-100" size={32} />
                            <p className="text-brand-navy text-sm relative z-10 italic pl-4">
                              "{review.comment}"
                            </p>
                          </div>
                          
                          {/* Admin Response Sub-Card */}
                          {review.admin_response && (
                            <div className="mt-4 p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex gap-3.5 items-start">
                              <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-brand-evergreen text-white">
                                <span className="text-[10px] font-bold">CS</span>
                              </div>
                              <div className="flex flex-col flex-1 gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-brand-navy">Tanggapan Admin</span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(review.admin_response_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-[13px] text-brand-navy leading-relaxed">
                                  {review.admin_response}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <ReviewForm orderId={order.id} mitraId={mitras.id} />
                  );
                }
              })()
            )}
            
          </div>

          {/* Right Column (Payment & Summary) */}
          <div className="flex flex-col w-full lg:w-96 shrink-0 gap-6">
            
            {/* Konfirmasi Selesai Card */}
            {order.status === 'service_done' && (
              <div className="flex flex-col rounded-2xl bg-purple-50 border border-purple-200 p-7 shadow-sm">
                <h2 className="font-bold text-[#1A2332] text-base mb-3 flex items-center gap-2">
                  <CheckCircle2 className="text-purple-600 animate-pulse" size={18} />
                  Konfirmasi Layanan Selesai
                </h2>
                <p className="text-gray-600 text-xs leading-relaxed mb-5">
                  Mitra pendamping menyatakan bahwa tugas pendampingan telah selesai. Mohon konfirmasi apabila layanan memang sudah selesai dilaksanakan dengan baik.
                </p>
                <ConfirmCompletionButton orderId={order.id} />
              </div>
            )}

            {/* Order Detail Card */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
              <h2 className="font-semibold text-brand-navy text-base mb-4">Detail Pesanan</h2>
              <div className="w-full h-px bg-gray-100 mb-4" />
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7B8D] text-[13px]">Paket</span>
                  <span className="font-medium text-brand-navy text-[13px]">{pkg?.name || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7B8D] text-[13px]">Durasi</span>
                  <span className="font-medium text-brand-navy text-[13px]">{pkg?.duration_hours || '-'} Jam</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7B8D] text-[13px]">Tanggal Pemesanan</span>
                  <span className="font-medium text-brand-navy text-[13px]">{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
              
              <div className="w-full h-px bg-gray-100 my-5" />
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-navy text-[15px]">Total Bayar</span>
                <span className="font-bold text-brand-evergreen text-xl">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Proof Card */}
            <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
              <h2 className="font-semibold text-brand-navy text-base mb-4">Status Pembayaran</h2>
              <div className="w-full h-px bg-gray-100 mb-4" />
              
              {!payment ? (
                <div className="flex items-center rounded-[10px] py-3.5 px-4 gap-2.5 bg-orange-50 border border-orange-100">
                  <AlertCircle size={18} className="text-orange-500" />
                  <span className="font-medium text-orange-600 text-[13px]">Menunggu Bukti Transfer</span>
                </div>
              ) : payment.status === 'verified' ? (
                <div className="flex items-center rounded-[10px] py-3.5 px-4 gap-2.5 bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 size={18} className="text-brand-evergreen" />
                  <span className="font-medium text-brand-evergreen text-[13px]">Pembayaran Terverifikasi</span>
                </div>
              ) : payment.status === 'ditolak' ? (
                <div className="flex items-center rounded-[10px] py-3.5 px-4 gap-2.5 bg-red-50 border border-red-100">
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="font-medium text-red-600 text-[13px]">Pembayaran Ditolak</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center rounded-[10px] py-3.5 px-4 gap-2.5 bg-blue-50 border border-blue-100">
                    <Clock size={18} className="text-blue-500" />
                    <span className="font-medium text-blue-600 text-[13px]">Menunggu Verifikasi Admin</span>
                  </div>
                  {payment.proof_of_transfer_url && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <FileText size={16} />
                      <a href={payment.proof_of_transfer_url} target="_blank" rel="noreferrer" className="text-brand-evergreen hover:underline">
                        Lihat Bukti Transfer
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
