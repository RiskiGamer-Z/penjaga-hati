import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Plus, CheckCircle, Clock, FileText, Search, ArrowRight, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function UserDashboard() {
  const supabase = await createClient();
  
  // 1. Dapatkan user yang sedang login
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  // 2. Ambil data profil
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // 3. Ambil data pesanan
  // Karena kita belum mengisi database dengan data dummy, kita tambahkan fallback aman
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      patient_name,
      patient_age,
      status,
      created_at,
      hospitals:hospital_id (name),
      service_packages:package_id (name, duration_hours),
      payments (id, status, proof_of_transfer_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 4. Hitung Statistik
  const safeOrders = orders || [];
  const totalOrders = safeOrders.length;
  const activeOrders = safeOrders.filter(o => o.status === 'in_progress').length;
  // Anggap 'menunggu verifikasi' juga bagian dari menunggu
  const waitingPayment = safeOrders.filter(o => o.status === 'pending_payment').length;
  const completedOrders = safeOrders.filter(o => o.status === 'completed').length;

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'User';

  // Helper: Tentukan status tampilan berdasarkan order + payment
  const getSmartStatus = (order: any) => {
    const payment = Array.isArray(order.payments) ? order.payments[0] : (order.payments || null);
    if (order.status === 'pending_payment') {
      if (payment?.proof_of_transfer_url) {
        // Bukti sudah diupload, tunggu verifikasi admin
        return 'awaiting_verification';
      }
      return 'pending_payment';
    }
    return order.status;
  };

  // Helper untuk Status Badge
  const getStatusBadge = (order: any) => {
    const smartStatus = getSmartStatus(order);
    
    let dotColor = "bg-orange-500";
    let bgColor = "bg-orange-50";
    let borderColor = "border-orange-100";
    let textColor = "text-orange-600";
    let statusText = "Menunggu Pembayaran";
    let isLive = true;

    switch(smartStatus) {
      case 'pending_payment':
        dotColor = "bg-orange-500"; bgColor = "bg-orange-50"; borderColor = "border-orange-100"; textColor = "text-orange-600";
        statusText = "Menunggu Pembayaran";
        break;
      case 'awaiting_verification':
        dotColor = "bg-purple-500"; bgColor = "bg-purple-50"; borderColor = "border-purple-100"; textColor = "text-purple-600";
        statusText = "Menunggu Verifikasi";
        break;
      case 'waiting_mitra':
        dotColor = "bg-orange-500"; bgColor = "bg-orange-50"; borderColor = "border-orange-100"; textColor = "text-orange-600";
        statusText = "Menunggu Mitra";
        break;
      case 'in_progress':
        dotColor = "bg-blue-500"; bgColor = "bg-blue-50"; borderColor = "border-blue-100"; textColor = "text-blue-600";
        statusText = "Sedang diproses";
        break;
      case 'service_done':
        dotColor = "bg-purple-500"; bgColor = "bg-purple-50"; borderColor = "border-purple-100"; textColor = "text-purple-600";
        statusText = "Menunggu Konfirmasi";
        break;
      case 'completed':
        dotColor = "bg-brand-evergreen"; bgColor = "bg-emerald-50"; borderColor = "border-emerald-100"; textColor = "text-brand-evergreen";
        statusText = "Selesai";
        isLive = false;
        break;
      case 'cancelled':
        dotColor = "bg-red-500"; bgColor = "bg-red-50"; borderColor = "border-red-100"; textColor = "text-red-600";
        statusText = "Dibatalkan";
        isLive = false;
        break;
      default:
        dotColor = "bg-gray-400"; bgColor = "bg-gray-50"; borderColor = "border-gray-200"; textColor = "text-gray-500";
        statusText = smartStatus.replace(/_/g, ' ');
        isLive = false;
    }

    return (
      <div className={`flex items-center w-fit rounded-full py-1.5 px-3 gap-2 ${bgColor} border ${borderColor}`}>
        <div className="relative flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${dotColor} relative z-10`} />
          {isLive && <div className={`absolute w-2 h-2 rounded-full ${dotColor} animate-ping opacity-75`} />}
        </div>
        <span className={`font-semibold ${textColor} text-[13px]`}>{statusText}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="tracking-[-0.02em] font-bold text-brand-navy text-[26px]">
              Selamat Datang, {firstName}!
            </h1>
            <p className="text-[#6B7B8D] text-[15px]">
              Kelola pesanan pendampingan pasien Anda di sini.
            </p>
          </div>
          <Link href="/booking" className="flex items-center rounded-xl py-3.5 px-6 gap-2 bg-brand-evergreen hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={18} className="text-white" />
            <span className="font-semibold text-white text-sm">
              Pesan Baru
            </span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="flex flex-col rounded-[14px] gap-2 bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6B7B8D] text-[13px]">Pesanan Aktif</span>
              <div className="flex items-center justify-center rounded-[10px] bg-emerald-50 size-9 text-brand-evergreen">
                <Clock size={18} />
              </div>
            </div>
            <div className="font-bold text-brand-navy text-[32px]">{activeOrders}</div>
          </div>
          <div className="flex flex-col rounded-[14px] gap-2 bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6B7B8D] text-[13px]">Total Pesanan</span>
              <div className="flex items-center justify-center rounded-[10px] bg-blue-50 size-9 text-blue-600">
                <FileText size={18} />
              </div>
            </div>
            <div className="font-bold text-brand-navy text-[32px]">{totalOrders}</div>
          </div>
          <div className="flex flex-col rounded-[14px] gap-2 bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6B7B8D] text-[13px]">Menunggu Konfirmasi Pembayaran</span>
              <div className="flex items-center justify-center rounded-[10px] bg-orange-50 size-9 text-orange-500">
                <Clock size={18} />
              </div>
            </div>
            <div className="font-bold text-brand-navy text-[32px]">{waitingPayment}</div>
          </div>
          <div className="flex flex-col rounded-[14px] gap-2 bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#6B7B8D] text-[13px]">Selesai</span>
              <div className="flex items-center justify-center rounded-[10px] bg-emerald-50 size-9 text-brand-evergreen">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="font-bold text-brand-navy text-[32px]">{completedOrders}</div>
          </div>
        </div>

        {/* Orders Table Section */}
        <div className="flex flex-col rounded-2xl overflow-clip bg-white border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-7 border-b border-gray-100 gap-4">
            <h2 className="font-semibold text-brand-navy text-lg">
              Pesanan Terbaru
            </h2>
            <div className="flex items-center rounded-lg py-2 px-4 gap-2 border border-gray-200 bg-gray-50/50 w-full md:w-auto">
              <Search size={16} className="text-[#6B7B8D]" />
              <input type="text" placeholder="Cari pesanan..." className="bg-transparent outline-none text-[13px] text-brand-navy placeholder:text-[#9CA3AF] w-full" />
            </div>
          </div>

          <div className="hidden md:flex items-center py-3.5 px-7 bg-gray-50/50 border-b border-gray-100">
            <div className="uppercase tracking-wider w-32 shrink-0 font-semibold text-[#6B7B8D] text-xs">ID Pesanan</div>
            <div className="uppercase tracking-wider flex-1 font-semibold text-[#6B7B8D] text-xs">Pasien</div>
            <div className="uppercase tracking-wider w-48 shrink-0 font-semibold text-[#6B7B8D] text-xs">Rumah Sakit</div>
            <div className="uppercase tracking-wider w-24 shrink-0 font-semibold text-[#6B7B8D] text-xs">Durasi</div>
            <div className="uppercase tracking-wider w-36 shrink-0 font-semibold text-[#6B7B8D] text-xs">Status</div>
            <div className="uppercase tracking-wider w-24 shrink-0 font-semibold text-[#6B7B8D] text-xs text-right">Aksi</div>
          </div>

          {safeOrders.length > 0 ? safeOrders.map((order: any) => (
            <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center py-4.5 px-7 border-b border-gray-100 hover:bg-gray-50/50 transition-colors gap-4 md:gap-0">
              <div className="w-full md:w-32 shrink-0 font-semibold text-brand-evergreen text-sm flex justify-between md:block">
                <span className="md:hidden text-gray-500 font-normal">ID Pesanan:</span>
                #{order.order_number}
              </div>
              <div className="flex flex-col flex-1 gap-0.5 w-full">
                <span className="md:hidden text-gray-500 text-xs mb-1">Pasien:</span>
                <div className="font-medium text-brand-navy text-sm">{order.patient_name}</div>
                <div className="text-[#9CA3AF] text-xs">{order.patient_age} tahun</div>
              </div>
              <div className="w-full md:w-48 shrink-0 text-[#4A5568] text-sm flex flex-col">
                <span className="md:hidden text-gray-500 text-xs mb-1">Rumah Sakit:</span>
                {order.hospitals?.name || "Belum dipilih"}
              </div>
              <div className="w-full md:w-24 shrink-0 text-[#4A5568] text-sm flex justify-between md:block">
                <span className="md:hidden text-gray-500 text-xs">Durasi:</span>
                {order.service_packages?.duration_hours ? `${order.service_packages.duration_hours} Jam` : "-"}
              </div>
              <div className="w-full md:w-36 shrink-0 flex justify-between md:block items-center">
                <span className="md:hidden text-gray-500 text-xs">Status:</span>
                {getStatusBadge(order)}
              </div>
              <div className="w-full md:w-24 shrink-0 font-medium text-brand-evergreen text-[13px] flex justify-end md:justify-end mt-2 md:mt-0">
                <Link href={`/user/orders/${order.order_number}`} className="hover:underline flex items-center gap-1">
                  Detail <ChevronRight size={14} className="md:hidden" />
                </Link>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <FileText className="text-gray-300 w-16 h-16 mb-4" />
              <h3 className="font-semibold text-brand-navy text-lg mb-1">Belum ada pesanan</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">
                Anda belum pernah memesan jasa pendamping pasien. Mulai pesan sekarang untuk memberikan perawatan terbaik bagi orang tersayang Anda.
              </p>
              <Link href="/booking" className="flex items-center rounded-xl py-3 px-6 gap-2 bg-brand-evergreen hover:bg-emerald-700 transition-colors shadow-sm">
                <Plus size={18} className="text-white" />
                <span className="font-semibold text-white text-sm">Pesan Baru</span>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
