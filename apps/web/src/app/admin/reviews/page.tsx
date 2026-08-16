"use client";

import { Star, MessageSquare, Loader2, AlertCircle, Quote, CornerDownRight } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import { respondToReviewAction } from "@/app/user/orders/reviews";

// Mock Data untuk Review jika tabel kosong / belum ada
const MOCK_REVIEWS = [
  {
    id: '1',
    rating: 5,
    comment: "Sangat membantu! Pendampingnya sabar dan telaten menjaga ibu saya selama masa pemulihan.",
    admin_response: "Terima kasih atas kepercayaannya. Kami berkomitmen memberikan layanan pendampingan terbaik untuk kesembuhan ibu Anda.",
    admin_response_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    users: { full_name: "Budi Pratama" },
    mitras: { users: { full_name: "Siti Aminah" } }
  },
  {
    id: '2',
    rating: 4,
    comment: "Pelayanan sangat baik, admin responsif dan pendamping datang tepat waktu.",
    admin_response: null,
    admin_response_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    users: { full_name: "Dewi Wulandari" },
    mitras: { users: { full_name: "Budi Santoso" } }
  },
  {
    id: '3',
    rating: 5,
    comment: "Sangat bersyukur dengan adanya Penjaga Hati. Ayah saya merasa nyaman ditemani oleh Mas Andi.",
    admin_response: null,
    admin_response_at: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    users: { full_name: "Rina Susanti" },
    mitras: { users: { full_name: "Andi Saputra" } }
  }
];

export default function AdminReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingReview, setRespondingReview] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          admin_response,
          admin_response_at,
          created_at,
          users:user_id (full_name),
          mitras:mitra_id (users (full_name))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          // Jika tabel belum ada, gunakan mock data agar UI bisa di-preview
          toast.info("Menggunakan data ulasan simulasi (Tabel belum tersedia)");
          setReviews(MOCK_REVIEWS);
        } else {
          throw error;
        }
      } else {
        setReviews(data || []);
      }
    } catch (err: any) {
      toast.error("Gagal mengambil data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleOpenResponseModal = (review: any) => {
    setRespondingReview(review);
    setResponseText(review.admin_response || "");
  };

  const handleCloseModal = () => {
    setRespondingReview(null);
    setResponseText("");
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.warning("Peringatan", "Tanggapan tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      const res = await respondToReviewAction(respondingReview.id, responseText.trim());
      if (res.success) {
        toast.success("Berhasil", "Tanggapan ulasan berhasil disimpan.");
        handleCloseModal();
        await fetchReviews();
      } else {
        toast.error("Gagal", res.error || "Gagal menyimpan tanggapan.");
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Ulasan & Penilaian</h1>
          <p className="text-gray-500 text-sm">Pantau kepuasan pelanggan terhadap layanan mitra dan berikan tanggapan resmi</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="flex flex-col flex-1 overflow-hidden rounded bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-40">Pelanggan</th>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-40">Mitra Pendamping</th>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-24">Rating</th>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Ulasan & Tanggapan</th>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-28">Tanggal</th>
                  <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 overflow-y-auto">
                {reviews.map(review => (
                  <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <span className="font-semibold text-brand-navy text-sm">{review.users?.full_name || "Pengguna Anonim"}</span>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="text-sm font-semibold text-gray-700">{review.mitras?.users?.full_name || "Mitra Anonim"}</span>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-1 bg-amber-50 w-fit px-2 py-0.5 rounded border border-amber-200">
                        <Star size={13} fill="#F59E0B" className="text-amber-500" />
                        <span className="font-bold text-amber-700 text-xs">{review.rating}.0</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-2 max-w-lg">
                        <div className="flex items-start gap-2">
                          <Quote size={12} className="text-gray-300 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 leading-relaxed">{review.comment}</span>
                        </div>
                        
                        {/* Tanggapan Admin jika ada */}
                        {review.admin_response && (
                          <div className="mt-2 text-xs bg-emerald-50/70 border border-emerald-100 p-3 rounded-lg flex items-start gap-2 text-slate-700 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
                            <CornerDownRight size={14} className="text-brand-evergreen shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-brand-navy text-[11px]">Tanggapan CS/Admin:</span>
                              <p className="italic text-[11.5px] leading-relaxed">"{review.admin_response}"</p>
                              {review.admin_response_at && (
                                <span className="text-[10px] text-gray-400 mt-1">
                                  Dijawab pada {new Date(review.admin_response_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500 align-top">
                      {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 align-top text-center">
                      <button
                        onClick={() => handleOpenResponseModal(review)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors ${
                          review.admin_response
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                            : "bg-brand-evergreen hover:bg-brand-evergreen/90 text-white shadow-sm"
                        }`}
                      >
                        {review.admin_response ? "Edit Respon" : "Tanggapi"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded border border-slate-200 shadow-sm flex-1">
          <MessageSquare size={48} className="text-slate-300 mb-4" />
          <p className="text-brand-navy font-bold text-lg font-serif">Belum ada Ulasan</p>
          <p className="text-gray-500 text-sm mt-1">Ulasan dari pelanggan akan muncul di sini setelah layanan selesai.</p>
        </div>
      )}

      {/* Response Modal Dialog */}
      {respondingReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-serif font-bold text-brand-navy text-lg mb-2">Tanggapan Ulasan Resmi</h3>
            <p className="text-xs text-gray-500 mb-4">
              Berikan tanggapan untuk ulasan dari pelanggan **{respondingReview.users?.full_name || "Pelanggan"}**. Tanggapan ini akan muncul secara publik di halaman pelanggan.
            </p>
            
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4 text-xs text-gray-600">
              <span className="font-bold text-brand-navy block mb-1">Ulasan Pelanggan:</span>
              <p className="italic">"{respondingReview.comment}"</p>
            </div>

            <form onSubmit={handleSubmitResponse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-brand-navy uppercase tracking-wider">Tanggapan Anda</label>
                <textarea
                  required
                  rows={4}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:border-brand-evergreen focus:ring-1 focus:ring-brand-evergreen focus:outline-none transition-all resize-none"
                  placeholder="Tuliskan tanggapan penyedia layanan/CS..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value.slice(0, 500))}
                  maxLength={500}
                />
                <span className="text-[10px] text-gray-400 text-right">{responseText.length}/500</span>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="text-xs font-semibold py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center text-xs font-bold py-2 px-5 rounded-xl bg-brand-evergreen text-white hover:bg-brand-evergreen/90 shadow-sm transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin mr-1.5" />
                      Menyimpan...
                    </>
                  ) : (
                    "Kirim Tanggapan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
