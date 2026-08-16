"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ShieldCheck, Zap, ArrowRight, Star, Loader2 } from "lucide-react";
import { login } from "../actions";
import { Suspense, useState } from "react";
import AuthToaster from "@/components/auth/AuthToaster";
import SubmitButton from "@/components/auth/SubmitButton";

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      console.error("Google login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex font-sans antialiased">

      {/* ============ LEFT PANEL — HERO BRANDING ============ */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 max-w-[580px] h-screen overflow-hidden relative shrink-0 p-12 text-white bg-cover bg-center bg-fixed"
        style={{ backgroundImage: 'linear-gradient(rgba(10, 31, 24, 0.82), rgba(10, 31, 24, 0.92)), url("/dashboard.png")' }}
      >
        {/* Gradient mesh blobs — sama persis dengan hero section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-700/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-teal-600/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl opacity-30" />
        </div>

        {/* Animated badge — persis seperti di hero */}
        <div className="relative z-10 flex items-center w-fit rounded-full py-2 px-4 gap-2 bg-emerald-500/15 border border-emerald-500/30 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="tracking-[0.08em] font-semibold text-emerald-400 text-[12px] uppercase">
            PLATFORM TERPERCAYA
          </span>
        </div>

        {/* Main Copy */}
        <div className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-5">
            <h1 className="tracking-tight font-bold text-white text-4xl leading-[1.2]">
              Pendamping Terpercaya di{" "}
              <span className="text-emerald-400">Sisi Pasien</span> Anda
            </h1>
            <p className="text-white/70 text-[16px] leading-relaxed max-w-sm">
              Masuk ke akun Anda untuk memesan jasa pendamping pasien profesional atau memantau pesanan aktif.
            </p>
          </div>

          {/* Feature items — styled seperti elemen glassmorphic hero */}
          <div className="flex flex-col gap-3">
            {[
              { icon: ShieldCheck, label: "Aman & Terverifikasi", desc: "Semua mitra telah diverifikasi ketat", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
              { icon: Zap, label: "Proses Cepat & Mudah", desc: "Konfirmasi dalam hitungan menit", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
              { icon: Star, label: "Mitra Berpengalaman", desc: "Rating rata-rata 4.9 / 5 bintang", color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.bg} border ${item.border} shrink-0`}>
                  <item.icon className={item.color} size={19} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-sm">{item.label}</span>
                  <span className="text-white/50 text-xs">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats — seperti hero section stats */}
          <div className="flex items-center gap-8 pt-2">
            {[
              { value: "2400+", label: "Pasien Terlayani" },
              { value: "350+", label: "Tenaga Profesional" },
              { value: "4.9★", label: "Rating" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-bold text-emerald-400 text-2xl">{stat.value}</span>
                <span className="text-white/50 text-[11px] font-medium mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10 hover:opacity-90 transition-opacity group mt-auto pt-8 border-t border-white/10">
          <div className="relative w-10 h-10 bg-white rounded-xl p-1.5 shadow-lg">
            <Image src="/logo.png" alt="Kasihi Logo" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base">Kasihi</span>
            <span className="text-white/40 text-[10px]">© {new Date().getFullYear()} Seluruh hak dilindungi.</span>
          </div>
        </Link>
      </div>

      {/* ============ RIGHT PANEL — FORM ============ */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 sm:px-12 lg:px-16 relative overflow-y-auto">
        {/* Frosted glass overlay sesuai tema */}
        <div className="absolute inset-0 bg-[#0a1f18]/80 backdrop-blur-2xl pointer-events-none lg:bg-white/90 lg:backdrop-blur-xl" />

        {/* Mobile Logo */}
        <Link href="/" className="absolute top-8 left-6 lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity z-10">
          <div className="relative w-8 h-8">
            <Image src="/logo.png" alt="Kasihi Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg text-white lg:text-brand-navy">Kasihi</span>
        </Link>

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-8 right-6 flex items-center gap-2 text-white/60 lg:text-gray-500 hover:text-emerald-400 transition-colors text-sm font-semibold z-10 bg-white/10 lg:bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 lg:border-gray-200 shadow-sm"
        >
          ← <span className="hidden sm:inline">Kembali</span>
        </Link>

        <div className="flex flex-col w-full max-w-sm gap-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col gap-3">
            {/* Emerald badge — konsisten dg dashboard */}
            <div className="flex items-center w-fit rounded-full py-1.5 px-4 gap-2 bg-emerald-500/15 border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-[0.08em] font-semibold text-emerald-400 text-[11px] uppercase">
                MASUK KE AKUN
              </span>
            </div>
            <h2 className="tracking-tight font-bold text-white lg:text-brand-navy text-[28px]">
              Selamat Datang 👋
            </h2>
            <p className="text-white/60 lg:text-[#6B7B8D] text-[14px]">
              Masuk untuk melanjutkan layanan Anda
            </p>
          </div>

          <Suspense fallback={null}>
            <AuthToaster />
          </Suspense>

          <form action={login} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-white/80 lg:text-brand-navy text-sm uppercase tracking-wider text-[11px]">
                Email
              </label>
              <div className="flex items-center rounded-2xl py-4 px-4 gap-3 bg-white/10 lg:bg-gray-50 border-2 border-white/20 lg:border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Mail className="text-emerald-400" size={16} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="bg-transparent w-full outline-none text-white lg:text-brand-navy text-[15px] placeholder:text-white/30 lg:placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white/80 lg:text-brand-navy text-[11px] uppercase tracking-wider">
                  Password
                </label>
                <Link href="#" className="font-semibold text-emerald-400 hover:text-emerald-300 text-[12px] transition-colors">
                  Lupa Password?
                </Link>
              </div>
              <div className="flex items-center rounded-2xl py-4 px-4 gap-3 bg-white/10 lg:bg-gray-50 border-2 border-white/20 lg:border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Lock className="text-teal-400" size={16} strokeWidth={2.5} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="bg-transparent w-full outline-none text-white lg:text-brand-navy text-[15px] placeholder:text-white/30 lg:placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="mt-2">
              <SubmitButton label="Masuk ke Akun" loadingLabel="Memeriksa kredensial..." />
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 lg:bg-gray-200 flex-1" />
            <span className="text-[10px] text-white/40 lg:text-gray-400 font-bold uppercase tracking-wider">atau masuk dengan</span>
            <div className="h-px bg-white/10 lg:bg-gray-200 flex-1" />
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/10 lg:bg-white border-2 border-white/20 lg:border-gray-200 hover:border-emerald-500 lg:hover:border-emerald-500 hover:bg-emerald-500/5 text-white lg:text-brand-navy font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin text-emerald-400" size={18} />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Google</span>
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <span className="text-white/50 lg:text-[#6B7B8D] text-sm">Belum punya akun?</span>
            <Link href="/auth/register" className="font-bold text-emerald-400 hover:text-emerald-300 text-sm transition-colors flex items-center gap-1">
              Daftar Sekarang <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
