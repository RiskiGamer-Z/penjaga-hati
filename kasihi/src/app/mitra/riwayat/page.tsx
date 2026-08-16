"use client";

import { Search, Filter, CalendarCheck, MapPin, Star, UserCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/utils/toast";
import Link from "next/link";
import { getMitraHistoryAction } from "./actions";

export default function MitraRiwayatPage() {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    averageRating: 5.0
  });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getMitraHistoryAction();
      if (!res.success || !res.orders || !res.reviews) {
        throw new Error(res.error || "Gagal mengambil data riwayat");
      }

      const orders = res.orders;
      const reviews = res.reviews;

      // Calculate stats
      const totalCompleted = orders.length;
      let averageRating = 5.0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        averageRating = Number((sum / reviews.length).toFixed(1));
      }

      setStats({
        totalCompleted,
        averageRating
      });

      setHistoryData(orders);
    } catch (err: any) {
      console.error("Error fetching history data:", err);
      toast.error("Gagal memuat riwayat pendampingan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history based on search query
  const filteredHistory = historyData.filter(item => 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#1A2332] text-[22px]">Riwayat Pendampingan</h1>
          <p className="text-[#6B7B8D] text-[13px]">Daftar tugas yang telah Anda selesaikan beserta ulasan klien</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl py-2.5 px-4 gap-2 bg-white border border-gray-200 focus-within:border-brand-evergreen transition-colors">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari ID atau Nama Pasien..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-[13px] text-brand-navy placeholder:text-gray-400 w-48"
            />
          </div>
        </div>
      </div>

      {/* History Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-brand-evergreen flex items-center justify-center">
               <CalendarCheck size={24} />
            </div>
            <div className="flex flex-col">
               <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Selesai</span>
               <span className="text-brand-navy text-2xl font-black">{stats.totalCompleted} <span className="text-sm font-medium text-gray-400">Tugas</span></span>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-brand-alpine flex items-center justify-center">
               <Star size={24} fill="currentColor" className="text-brand-alpine" />
            </div>
            <div className="flex flex-col">
               <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rata-rata Rating</span>
               <span className="text-brand-navy text-2xl font-black">{stats.averageRating} <span className="text-sm font-medium text-gray-400">/ 5.0</span></span>
            </div>
         </div>
      </div>

      {/* History List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-2">
         {loading ? (
           <div className="flex items-center justify-center py-20">
             <Loader2 size={32} className="animate-spin text-brand-evergreen" />
           </div>
         ) : filteredHistory.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-4">
             <CalendarCheck size={48} className="text-gray-200 mb-4" />
             <p className="text-gray-500 font-medium">Belum ada riwayat pendampingan.</p>
             <p className="text-gray-400 text-sm mt-1">Tugas selesai akan muncul di sini beserta ulasan.</p>
           </div>
         ) : (
           <div className="divide-y divide-gray-100">
              {filteredHistory.map((item) => {
                 const review = Array.isArray(item.reviews) ? item.reviews[0] : item.reviews;
                 return (
                   <div key={item.id} className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-gray-50/50 transition-colors">
                      {/* Info Panel */}
                      <div className="flex-1 flex flex-col gap-3">
                         <div className="flex items-center gap-3">
                            <span className="font-bold text-brand-evergreen text-sm">#{item.id.slice(0, 8).toUpperCase()}</span>
                            <span className="rounded-md py-1 px-2 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                               Selesai
                            </span>
                            <span className="text-xs font-bold text-gray-400 ml-auto">
                              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                               <UserCircle size={20} />
                            </div>
                            <span className="font-bold text-[#1A2332] text-base">Pasien: {item.patient_name} ({item.patient_age} Thn)</span>
                         </div>
                         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-10">
                            <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
                               <MapPin size={14} className="text-gray-400" />
                               {item.hospitals?.name || "Rawat Rumah"}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block" />
                            <div className="flex items-center gap-1.5 text-gray-500 text-[13px] font-medium">
                               {item.service_packages?.name || "Paket Kustom"}
                            </div>
                         </div>
                      </div>

                      {/* Rating Panel */}
                      <div className="lg:w-80 bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2 relative min-h-[90px]">
                         {review ? (
                           <>
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Star size={40} fill="currentColor" className="text-brand-alpine" />
                             </div>
                             <div className="flex items-center gap-1 relative z-10">
                                {[...Array(5)].map((_, i) => (
                                   <Star key={i} size={14} fill={i < review.rating ? "#FBBF24" : "none"} className={i < review.rating ? "text-amber-400" : "text-gray-300"} />
                                ))}
                             </div>
                             <p className="text-gray-600 text-[13px] italic relative z-10 leading-relaxed">
                                "{review.comment || 'Tanpa komentar.'}"
                             </p>
                           </>
                         ) : (
                           <div className="flex flex-col justify-center items-center h-full text-center text-gray-400 text-xs py-2">
                             <span>Belum ada ulasan dari pelanggan.</span>
                           </div>
                         )}
                      </div>
                   </div>
                 );
              })}
           </div>
         )}
      </div>
    </div>
  );
}
