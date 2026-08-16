"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global app error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans bg-[#F7FAFA]">
      {/* Decorative blurred background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#E8853D]/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white/75 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(239,68,68,0.04)] text-center flex flex-col items-center">
        {/* Animated pulse warning container */}
        <div className="w-20 h-20 rounded-[1.5rem] bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-inner animate-pulse">
          <AlertTriangle size={36} />
        </div>

        <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.25em] bg-red-50 px-4 py-1.5 rounded-full mb-3 border border-red-100">
          Kesalahan Sistem
        </span>

        <h1 className="text-2xl font-black text-[#1A2332] tracking-tight mb-2">
          Terjadi Gangguan Sistem
        </h1>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Maaf, terjadi gangguan sementara di server kami. Silakan klik tombol di bawah untuk memuat ulang rute atau kembali ke Beranda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 bg-[#1B6B4A] text-white font-bold text-sm hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-100"
          >
            <RefreshCw size={16} />
            <span>Coba Lagi</span>
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Home size={16} />
            <span>Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
