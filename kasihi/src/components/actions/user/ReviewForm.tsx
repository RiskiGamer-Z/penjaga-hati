"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { submitReviewAction } from "@/app/user/orders/reviews";
import { toast } from "@/utils/toast";

interface ReviewFormProps {
  orderId: string;
  mitraId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ orderId, mitraId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.warning("Peringatan", "Silakan pilih rating bintang terlebih dahulu.");
      return;
    }

    if (!comment.trim()) {
      toast.warning("Peringatan", "Silakan tulis ulasan/komentar Anda.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitReviewAction(orderId, mitraId, {
        rating,
        comment: comment.trim(),
      });

      if (res.success) {
        toast.success("Ulasan Dikirim", "Terima kasih atas ulasan yang Anda berikan.");
        if (onSuccess) onSuccess();
      } else {
        toast.error("Gagal", res.error || "Gagal mengirimkan ulasan.");
      }
    } catch (err) {
      toast.error("Error", "Terjadi kesalahan sistem saat mengirim ulasan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-100 p-7 shadow-sm">
      <h2 className="font-semibold text-brand-navy text-base mb-2">Berikan Ulasan Layanan</h2>
      <p className="text-gray-500 text-xs mb-5">
        Bagikan pengalaman Anda menggunakan jasa mitra ini untuk membantu meningkatkan kualitas pelayanan kami.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Star Rating Selector */}
        <div className="flex flex-col gap-2 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating Layanan</span>
          <div className="flex items-center gap-2 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={32}
                  className={`transition-colors duration-150 ${
                    star <= (hoverRating || rating)
                      ? "text-amber-500 fill-amber-500"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-[13px] font-bold text-brand-navy mt-1.5 min-h-[20px]">
            {rating === 1 && "Buruk sekali 😞"}
            {rating === 2 && "Buruk 🙁"}
            {rating === 3 && "Cukup Baik 😐"}
            {rating === 4 && "Sangat Baik 🙂"}
            {rating === 5 && "Sempurna! 🤩"}
            {!rating && "Pilih rating"}
          </span>
        </div>

        {/* Comment Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-navy uppercase tracking-wider">
            Tulis Ulasan Anda
          </label>
          <div className="relative">
            <textarea
              className="w-full min-h-[100px] max-h-[180px] p-3.5 text-sm border border-gray-200 rounded-xl focus:border-brand-evergreen focus:ring-1 focus:ring-brand-evergreen focus:outline-none transition-all pr-8"
              placeholder="Ceritakan pengalaman Anda mengenai sikap, kerapian, dan ketepatan waktu mitra..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              disabled={submitting}
              maxLength={500}
            />
            <MessageSquare size={16} className="absolute right-3.5 top-3.5 text-gray-300 pointer-events-none" />
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span>Ulasan Anda akan dimoderasi oleh admin.</span>
            <span>{comment.length}/500</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center w-full py-3 px-4 bg-brand-evergreen text-white font-bold text-sm rounded-xl hover:bg-brand-evergreen/90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Mengirimkan Ulasan...
            </>
          ) : (
            "Kirim Ulasan"
          )}
        </button>
      </form>
    </div>
  );
}
