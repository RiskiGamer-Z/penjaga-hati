"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, Filter, Clock, MapPin, UserCircle, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getMitraOrdersAction, acceptOrderAction, rejectOrderAction } from "./actions";
import { toast } from "@/utils/toast";
import { motion, AnimatePresence } from "framer-motion";

export default function MitraPesananPage() {
  const [loading, setLoading] = useState(true);
  const [mitra, setMitra] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'baru' | 'mendatang' | 'batal' | 'selesai'>('baru');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mitraData } = await supabase.from('mitras').select('id').eq('user_id', user.id).single();
      if (!mitraData) return;

      setMitra(mitraData);
      
      const res = await getMitraOrdersAction(mitraData.id, 'all');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err: any) {
      toast.error("Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await acceptOrderAction(orderId, mitra.id);
      if (res.success) {
        toast.success("Pesanan berhasil diterima!");
        fetchOrders();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Gagal menerima pesanan");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt("Alasan penolakan:");
    if (!reason) return;

    setProcessingId(orderId);
    try {
      const res = await rejectOrderAction(orderId, mitra.id, reason);
      if (res.success) {
        toast.success("Pesanan berhasil ditolak.");
        fetchOrders();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Gagal menolak pesanan");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;


    if (activeTab === 'baru') return order.status === 'waiting_mitra';
    if (activeTab === 'mendatang') return ['accepted', 'in_transit', 'arrived', 'in_progress'].includes(order.status);
    if (activeTab === 'batal') return order.status === 'cancelled';
    if (activeTab === 'selesai') return ['completed', 'service_done'].includes(order.status);
    return true;
  });

  const getStatusLabel = (status: string) => {
    if (status === 'waiting_mitra') return 'Menunggu Mitra';
    if (status === 'cancelled') return 'Dibatalkan';
    if (status === 'completed') return 'Selesai';
    if (status === 'service_done') return 'Menunggu Konfirmasi';
    if (status === 'accepted') return 'Diterima';
    if (status === 'in_transit') return 'Dalam Perjalanan';
    if (status === 'arrived') return 'Tiba di Lokasi';
    if (status === 'in_progress') return 'Berjalan';
    return status.replace('_', ' ');
  };

  const getStatusColor = (status: string) => {
    if (status === 'waiting_mitra') return 'bg-blue-50 text-blue-600 border-blue-100';
    if (status === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
    if (status === 'completed') return 'bg-emerald-50 text-brand-evergreen border-emerald-100';
    if (status === 'service_done') return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-orange-50 text-orange-600 border-orange-100';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#1A2332] text-[22px]">Pesanan Masuk</h1>
          <p className="text-[#6B7B8D] text-[13px]">Kelola dan respons permintaan pendampingan terbaru Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl py-2.5 px-4 gap-2 bg-white border border-gray-200 focus-within:border-brand-evergreen transition-colors shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien..." 
              className="bg-transparent outline-none text-[13px] text-brand-navy placeholder:text-gray-400 w-48"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'baru', label: 'Permintaan Baru', count: orders.filter(o => o.status === 'waiting_mitra').length },
          { id: 'mendatang', label: 'Sedang Berjalan', count: orders.filter(o => ['accepted', 'in_transit', 'arrived', 'in_progress'].includes(o.status)).length },
          { id: 'selesai', label: 'Selesai', count: orders.filter(o => ['completed', 'service_done'].includes(o.status)).length },
          { id: 'batal', label: 'Dibatalkan', count: orders.filter(o => o.status === 'cancelled').length }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-6 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-brand-evergreen text-brand-evergreen' 
                : 'border-transparent text-gray-500 hover:text-brand-navy'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`rounded-full py-0.5 px-2 text-[10px] ml-1 ${
                activeTab === tab.id ? 'bg-brand-evergreen text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="flex flex-col gap-4 relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-brand-evergreen" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Tidak ada pesanan di kategori ini.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden hover:border-brand-evergreen/30 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Main Info */}
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-evergreen text-sm">#{order.id.slice(0,8).toUpperCase()}</span>
                        <span className={`rounded-md py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                           <UserCircle size={20} />
                        </div>
                        <span className="font-bold text-[#1A2332] text-lg">Pasien: {order.patient_name} ({order.patient_age} Tahun)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:pl-10">
                         <div className="flex items-center gap-3 text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Clock size={18} className="text-brand-evergreen shrink-0" />
                            <div className="flex flex-col">
                               <span className="font-bold text-brand-navy">Layanan: {order.service_packages?.name}</span>
                               <span className="text-xs text-gray-500">Durasi: {order.service_packages?.duration_hours} Jam</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <MapPin size={18} className="text-brand-alpine shrink-0" />
                            <div className="flex flex-col">
                               <span className="font-bold text-brand-navy truncate max-w-[200px]">{order.hospitals?.name || '-'}</span>
                               <span className="text-xs text-gray-500 truncate max-w-[200px]">{order.patient_condition || 'Rawat Umum'}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="md:w-64 bg-gray-50/50 p-6 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100">
                     <div className="flex flex-col items-center text-center gap-1 mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estimasi Pendapatan</span>
                        <span className="text-xl font-black text-brand-evergreen">
                          {formatPrice(order.service_packages?.base_price || 0)}
                        </span>
                     </div>
                     
                     {order.status === 'waiting_mitra' ? (
                       <>
                         <button 
                           onClick={() => handleAccept(order.id)}
                           disabled={processingId === order.id}
                           className="flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 bg-brand-evergreen text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 disabled:opacity-50"
                         >
                           {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Terima Tugas
                         </button>
                         <button 
                           onClick={() => handleReject(order.id)}
                           disabled={processingId === order.id}
                           className="flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 border-2 border-red-100 text-red-500 bg-red-50 font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                         >
                           Tolak
                         </button>
                       </>
                     ) : (
                       <Link href={`/mitra/pesanan/${order.id}`} className="flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 bg-brand-evergreen text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10">
                         Lihat Detail
                       </Link>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
