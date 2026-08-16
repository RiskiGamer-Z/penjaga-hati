"use client";

/**
 * PageLoader — Loading state profesional & branded untuk halaman customer.
 * Menampilkan logo Penjaga Hati dengan animasi denyut lembut + shimmer,
 * menggantikan spinner generik agar terasa premium.
 */
export default function PageLoader({ label = "Memuat halaman" }: { label?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-white to-emerald-50/40">
      {/* Logo mark dengan denyut */}
      <div className="relative flex items-center justify-center">
        {/* Ripple rings */}
        <span className="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-ping" />
        <span className="absolute w-16 h-16 rounded-full bg-emerald-500/15 animate-pulse" />

        {/* Heart mark */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-8 h-8 animate-[heartbeat_1.4s_ease-in-out_infinite]"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>

      {/* Brand + label */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
          <span className="text-[#0a1f18]">Penjaga</span>
          <span className="text-emerald-600">Hati</span>
        </div>

        {/* Shimmer loading bar */}
        <div className="relative w-40 h-1 rounded-full bg-emerald-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-[shimmerbar_1.2s_ease-in-out_infinite]" />
        </div>

        <p className="text-slate-400 text-xs font-medium tracking-wide mt-1">{label}…</p>
      </div>

      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          40% { transform: scale(0.95); }
          60% { transform: scale(1.08); }
        }
        @keyframes shimmerbar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(280%); }
        }
      `}</style>
    </div>
  );
}
