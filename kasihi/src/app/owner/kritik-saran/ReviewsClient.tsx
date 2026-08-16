"use client";

import { useState } from "react";
import { Star, MessageSquare, Search, Filter, Quote, Sparkles } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  users: {
    full_name: string | null;
  } | null;
  mitras: {
    users: {
      full_name: string | null;
    } | null;
  } | null;
}

interface ReviewsClientProps {
  initialReviews: Review[];
}

export default function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Calculate metrics
  const totalReviews = initialReviews.length;
  const avgRating = totalReviews > 0 
    ? (initialReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // Calculate rating distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  initialReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 5|4|3|2|1;
    distribution[star]++;
  });

  const positiveRate = totalReviews > 0
    ? Math.round(((distribution[5] + distribution[4]) / totalReviews) * 100)
    : 0;

  // Filter reviews
  const filteredReviews = initialReviews.filter(review => {
    const matchesSearch = 
      (review.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (review.mitras?.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = 
      ratingFilter === "all" || 
      review.rating.toString() === ratingFilter;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Card */}
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-44">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Kepuasan Pelanggan</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Star size={18} fill="#FBBF24" className="text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-black tracking-tight">{avgRating}</span>
            <span className="text-slate-400 text-sm font-medium">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Nilai rata-rata dari {totalReviews} ulasan terdaftar.</p>
        </div>

        {/* Distribution Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-2.5 h-44 justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Distribusi Bintang</span>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = distribution[stars as 5|4|3|2|1];
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="w-3 text-right">{stars}</span>
                <Star size={12} fill="#FBBF24" className="text-amber-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div style={{ width: `${pct}%` }} className="h-full bg-amber-400 rounded-full" />
                </div>
                <span className="w-8 text-right text-slate-400 text-[10px]">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Sentiment Card */}
        <div className="bg-gradient-to-br from-brand-evergreen to-emerald-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-44">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Umpan Balik Positif</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles size={18} className="text-emerald-200" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-black tracking-tight">{positiveRate}%</span>
          </div>
          <p className="text-[11px] text-emerald-100/80 font-medium">Ulasan dengan rating bintang 4 atau 5.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Cari ulasan atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-evergreen/20 focus:border-brand-evergreen transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs font-bold text-slate-600">
          <Filter size={14} className="text-slate-400" />
          <span>Filter Rating:</span>
          <div className="flex gap-1.5">
            {["all", "5", "4", "3", "2", "1"].map(rating => (
              <button
                key={rating}
                onClick={() => setRatingFilter(rating)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
                  ratingFilter === rating
                    ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {rating === "all" ? "Semua" : `${rating} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => {
            const dateStr = new Date(review.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            const clientName = review.users?.full_name || "Pengguna Anonim";
            const clientInitial = clientName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
            const mitraName = review.mitras?.users?.full_name || "Mitra Anonim";

            return (
              <div 
                key={review.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-4 right-4 text-slate-100 group-hover:text-slate-200 transition-colors pointer-events-none">
                  <Quote size={40} className="transform rotate-180" />
                </div>

                <div className="flex flex-col gap-4">
                  {/* Rating Stars & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < review.rating ? "#FBBF24" : "none"}
                          className={i < review.rating ? "text-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{dateStr}</span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic pr-6">
                    "{review.comment}"
                  </p>
                </div>

                {/* Sender & Target Mitra details */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-navy to-slate-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 border border-white/10 shadow-sm">
                    {clientInitial}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-brand-navy truncate">{clientName}</span>
                    <span className="text-[9.5px] text-slate-400 font-bold">
                      Pendamping: <span className="text-brand-evergreen font-extrabold">{mitraName}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 text-xs flex flex-col items-center gap-2">
          <MessageSquare size={32} className="text-slate-200" />
          Tidak ada ulasan kritik &amp; saran yang cocok dengan filter pencarian Anda.
        </div>
      )}
    </div>
  );
}
