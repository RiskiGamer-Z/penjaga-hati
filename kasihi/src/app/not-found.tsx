import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans bg-[#F7FAFA]">
      {/* Premium ambient decorative blurred background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[#1B6B4A]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#E8853D]/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white/75 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(26,107,74,0.06)] text-center flex flex-col items-center">
        {/* Animated bounce icon container */}
        <div className="w-20 h-20 rounded-[1.5rem] bg-[#1B6B4A]/10 text-[#1B6B4A] flex items-center justify-center mb-6 shadow-inner animate-bounce">
          <FileQuestion size={36} />
        </div>

        <span className="text-[11px] font-black text-[#1B6B4A] uppercase tracking-[0.25em] bg-[#1B6B4A]/10 px-4 py-1.5 rounded-full mb-3">
          Error 404
        </span>

        <h1 className="text-3xl font-black text-[#1A2332] tracking-tight mb-2">
          Halaman Tidak Ditemukan
        </h1>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Maaf, halaman yang Anda tuju tidak tersedia atau telah dipindahkan. Mari kembali ke beranda untuk melanjutkan pencarian pendamping terbaik.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 px-6 bg-[#1B6B4A] text-white font-bold text-sm hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-200"
        >
          <Home size={18} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
