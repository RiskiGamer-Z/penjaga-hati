"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Star, Play } from "lucide-react";
import { initAllScrollAnimations } from "@/utils/scrollAnimation";
import { initFloatingLeaves, initParticles, initCounterAnimations } from "@/utils/floatingLeaves";
import { createClient } from "@/utils/supabase/client";
import { getHomePackagesAction } from "./home-actions";

export default function Home() {
  const [statsData, setStatsData] = useState({ orders: 0, mitras: 0 });
  const [packages, setPackages] = useState<any[]>([]);
  const [tierGroups, setTierGroups] = useState<Record<string, any[]>>({});

  useEffect(() => {
    initAllScrollAnimations();
    const leafCleanup = initFloatingLeaves("floating-leaves");
    const particleCleanup = initParticles("hero-particles", 3);

    const timelineNumbers = document.querySelectorAll(".timeline-number");
    timelineNumbers.forEach((number) => {
      const parent = number.closest(".timeline-item");
      if (parent) {
        parent.addEventListener("mouseenter", () => {
          number.classList.add("animate-shine", "animate-shiftRight");
        });
        parent.addEventListener("mouseleave", () => {
          number.classList.remove("animate-shine", "animate-shiftRight");
        });
      }
    });

    const fetchData = async () => {
      const supabase = createClient();
      const res = await getHomePackagesAction();
      if (res.success && res.packages) {
        setPackages(res.packages);
        const groups = res.packages.reduce((acc: Record<string, any[]>, pkg: any) => {
          const tier = pkg.tier || "bronze";
          if (!acc[tier]) acc[tier] = [];
          acc[tier].push(pkg);
          return acc;
        }, {} as Record<string, any[]>);
        setTierGroups(groups);
      }
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
      const { count: mitraCount } = await supabase.from("mitras").select("*", { count: "exact", head: true });
      setStatsData({
        orders: (orderCount || 0) + 2400,
        mitras: (mitraCount || 0) + 350
      });
      setTimeout(() => initCounterAnimations(), 800);
    };
    fetchData();
    return () => {
      if (leafCleanup) leafCleanup();
      if (particleCleanup) particleCleanup();
    };
  }, []);

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

  const tierInfo: Record<string, { badge: string; color: string; glow: string; bgGradient: string; features: string[] }> = {
    bronze: {
      badge: "\uD83E\uDD49 BRONZE",
      color: "from-slate-500 to-slate-400",
      glow: "shadow-slate-900/20",
      bgGradient: "bg-gradient-to-br from-slate-50 to-white",
      features: ["12-24 Jam", "Vital dasar", "Antrian RS"]
    },
    silver: {
      badge: "\uD83E\uDD48 SILVER",
      color: "from-gray-600 to-gray-400",
      glow: "shadow-gray-900/20",
      bgGradient: "bg-gradient-to-br from-gray-50 to-white",
      features: ["1-7 Hari", "Absensi 6j", "Laporan harian"]
    },
    gold: {
      badge: "\uD83E\uDD47 GOLD",
      color: "from-amber-500 to-yellow-400",
      glow: "shadow-amber-900/30",
      bgGradient: "bg-gradient-to-br from-amber-50 to-orange-50",
      features: ["1-4 Minggu", "Dokter online", "Pemantauan 24j"]
    }
  };

  const services = [
    { icon: "\uD83C\uDFE5", title: "Pendampingan Rawat Inap", desc: "Penjaga profesional mendampingi pasien di rumah sakit, memastikan kenyamanan dan keamanan 24 jam penuh." },
    { icon: "\uD83D\uDC75", title: "Pendampingan Lansia", desc: "Pendampingan penuh empati untuk orang tua lanjut usia, mencakup aktivitas harian, nutrisi, dan mobilisasi." },
    { icon: "\uD83D\uDC89", title: "Pelayanan Caregiver", desc: "Pelayanan caregiver oleh tenaga terlatih yang membantu aktivitas harian dan fisioterapi ringan." },
    { icon: "\uD83E\uDEE0", title: "Pendampingan Psikologi", desc: "Pendampingan psikososial dan emosional oleh tenaga profesional terlatih, membantu pasien menghadapi kecemasan, stres, dan proses pemulihan jangka panjang." },
    { icon: "\uD83D\uDCCB", title: "Rencana Sistem Rawat Rujukan", desc: "Asesmen menyeluruh kondisi pasien dan penyusunan rencana sistem rawat rujukan yang terkoordinasi." }
  ];

  const testimonialData = [
    { text: "Penjaga dari Penjaga Hati sangat sabar dan profesional. Ibu saya merasa nyaman.", name: "Ratna Dewi", location: "Semarang", initials: "R", bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600" },
    { text: "Proses pendaftarannya mudah dan cepat. Sangat responsif dan terpercaya.", name: "Budi Santoso", location: "Solo", initials: "B", bgColor: "bg-gradient-to-br from-emerald-600 to-emerald-400" },
    { text: "Layanan pendampingan lansia luar biasa. Ayah saya ditangani dengan telaten dan penuh kasih sayang.", name: "Siti Mariam", location: "Yogyakarta", initials: "S", bgColor: "bg-gradient-to-br from-teal-500 to-emerald-700" }
  ];

  const steps = [
    { num: "1", title: "Konsultasi Awal", desc: "Hubungi kami melalui telepon, WhatsApp, atau website. Tim kami akan mendengarkan kebutuhan Anda secara gratis." },
    { num: "2", title: "Asesmen Kebutuhan", desc: "Koordinator kami melakukan penilaian kondisi pasien untuk menyusun rencana pendampingan yang tepat." },
    { num: "3", title: "Penugasan Penjaga Profesional", desc: "Kami mencocokkan pasien dengan penjaga yang paling sesuai berdasarkan keahlian dan lokasi." },
    { num: "4", title: "Pemantauan Berkelanjutan", desc: "Supervisor memantau kualitas layanan secara rutin dan keluarga dapat mengakses laporan kapan saja." }
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full bg-transparent font-sans antialiased overflow-x-hidden">
        {/* ===================== Hero Section ===================== */}
        <section
          className="relative w-full flex items-center justify-center min-h-[100svh] pt-28 pb-20 md:pt-36 md:pb-28 px-5 sm:px-8 md:px-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'linear-gradient(rgba(10, 31, 24, 0.78), rgba(10, 31, 24, 0.88)), url("/dashboard.png")' }}
        >
          <div id="floating-leaves" className="absolute inset-0 pointer-events-none overflow-hidden" />
          <div id="hero-particles" className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none overflow-hidden" />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-emerald-700/30 rounded-full blur-3xl opacity-40" />
            <div className="absolute top-1/3 right-1/4 w-56 md:w-72 h-56 md:h-72 bg-teal-600/20 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="max-w-4xl w-full flex flex-col items-center justify-center z-10 relative text-center">
            <div className="flex items-center justify-center w-fit rounded-full py-2 px-4 gap-2 bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-[0.04em] font-semibold text-emerald-400 text-xs sm:text-[13px]">
                LAYANAN PROFESIONAL 24/7
              </span>
            </div>

            <h1 className="mt-6 tracking-tight font-bold text-white text-[2rem] leading-[1.2] sm:text-4xl md:text-6xl md:leading-[1.15]">
              Mendampingi dengan <span className="text-emerald-400">Sepenuh</span> <span className="text-red-400">Hati</span>
            </h1>

            <p className="mt-5 text-white/80 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl font-light">
              Kami hadir untuk mendampingi orang-orang tercinta Anda dengan empati, keahlian, dan dedikasi penuh.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row w-full sm:w-auto justify-center items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/booking" className="flex items-center justify-center rounded-full py-3.5 px-8 gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-900/40 transform hover:-translate-y-1 text-white font-semibold">
                <span>Konsultasi Gratis</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="#layanan" className="flex items-center justify-center rounded-full py-3.5 px-8 gap-2.5 border border-white/35 hover:bg-white/10 hover:border-white/60 transition-all text-white font-medium backdrop-blur-sm">
                <span>Pelajari Lebih Lanjut</span>
              </Link>
            </div>

            <div className="mt-12 w-full max-w-2xl grid grid-cols-3 gap-4 sm:gap-8 opacity-95">
              <div className="flex flex-col items-center gap-1">
                <div className="font-bold text-emerald-400 text-2xl sm:text-4xl md:text-5xl" data-counter={statsData.orders} data-counter-format="plus">0+</div>
                <div className="font-medium text-white/70 text-xs sm:text-sm mt-1 text-center">Pasien Terlayani</div>
              </div>
              <div className="flex flex-col items-center gap-1 sm:border-x border-white/15">
                <div className="font-bold text-emerald-400 text-2xl sm:text-4xl md:text-5xl" data-counter={statsData.mitras} data-counter-format="plus">0+</div>
                <div className="font-medium text-white/70 text-xs sm:text-sm mt-1 text-center">Tenaga Profesional</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="font-bold text-emerald-400 text-2xl sm:text-4xl md:text-5xl" data-counter="4.9">0</div>
                <div className="font-medium text-white/70 text-xs sm:text-sm mt-1 text-center">Rating / 5</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== Layanan Kami ===================== */}
        <section id="layanan" className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-12 md:gap-16 bg-gradient-to-b from-white to-emerald-50">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-xs sm:text-[13px]">
              Apa yang Kami Tawarkan
            </div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-2xl sm:text-3xl md:text-[42px] leading-tight">
              Layanan Lengkap untuk Setiap Kebutuhan
            </h2>
            <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed">
              Dari pendampingan harian hingga pendampingan pasca-operasi, tim kami siap memberikan bantuan terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl gap-5 md:gap-6" data-stagger-animation="scroll-slide-up" data-stagger-delay="100">
            {services.map((service, idx) => (
              <div
                key={idx}
                data-stagger-item
                className="group flex flex-col rounded-2xl py-7 px-6 gap-4 bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden h-full"
              >
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="text-4xl">{service.icon}</div>
                <h3 className="font-bold text-[#0a1f18] text-lg">{service.title}</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed flex-1">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== Cara Kerja - Timeline ===================== */}
        <section
          className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-12 md:gap-16 relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: 'linear-gradient(rgba(10, 31, 24, 0.88), rgba(10, 31, 24, 0.95)), url("/dashboard.png")' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-0 w-72 md:w-80 h-72 md:h-80 bg-emerald-900/40 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-1/3 right-0 w-80 md:w-96 h-80 md:h-96 bg-teal-800/30 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="flex flex-col items-center max-w-2xl gap-4 text-center relative z-10" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-400 text-xs sm:text-[13px]">Cara Kerja</div>
            <h2 className="tracking-tight font-bold text-white text-2xl sm:text-3xl md:text-[42px] leading-tight">Mulai dalam 4 Langkah Mudah</h2>
            <p className="text-white/60 text-base sm:text-[17px] leading-relaxed">Proses kami dirancang agar cepat, transparan, dan berpusat pada kebutuhan pasien.</p>
          </div>

          <div className="w-full max-w-2xl relative z-10" data-stagger-animation="scroll-slide-up" data-stagger-delay="150">
            <div className="flex flex-col gap-8 md:gap-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 sm:gap-6 group timeline-item cursor-pointer" data-stagger-item>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-base border-4 border-[#0a1f18] shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/50 transition-all transform group-hover:scale-110 timeline-number">
                      {step.num}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[2rem] mt-2 bg-gradient-to-b from-emerald-500/70 to-teal-500/20" />
                    )}
                  </div>
                  <div className="flex-1 pb-2 pt-1.5 group-hover:translate-x-1 transition-transform duration-300">
                    <h3 className="font-bold text-white text-base sm:text-lg mb-2 group-hover:animate-shine">{step.title}</h3>
                    <p className="text-white/70 text-[14px] sm:text-[15px] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== Testimoni ===================== */}
        <section className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-12 md:gap-16 bg-white">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-xs sm:text-[13px]">Testimoni Keluarga</div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-2xl sm:text-3xl md:text-[42px] leading-tight">Kepercayaan yang Kami Jaga</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl gap-5 md:gap-6" data-stagger-animation="scroll-slide-up" data-stagger-delay="100">
            {testimonialData.map((testi, idx) => (
              <div key={idx} className="group flex flex-col rounded-2xl py-7 px-7 gap-5 bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full" data-stagger-item>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}</div>
                <p className="italic text-gray-700 text-[15px] leading-relaxed flex-1 font-light">{testi.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className={`flex items-center justify-center rounded-full w-12 h-12 text-white font-bold text-sm shrink-0 ${testi.bgColor} shadow-lg`}>{testi.initials}</div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0a1f18] text-[15px]">{testi.name}</span>
                    <span className="text-gray-500 text-[13px]">{testi.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== Paket Tier ===================== */}
        <section id="paket" className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-12 md:gap-16 bg-gradient-to-b from-white to-emerald-50/50">
          <div className="flex flex-col items-center max-w-3xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-xs sm:text-[13px]">Paket Layanan Premium</div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-2xl sm:text-3xl md:text-[48px] leading-tight">
              Pilih Tier Pendampingan Terbaik
            </h2>
            <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed max-w-2xl">
              Tiga level paket dengan fitur lengkap — dari kunjungan singkat hingga perawatan intensif berminggu-minggu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 lg:gap-8 w-full max-w-6xl mx-auto items-stretch pt-4">
            {["bronze", "silver", "gold"].map((tierKey) => {
              const info = tierInfo[tierKey];
              const tierPkgs = tierGroups[tierKey] || [];
              const featured = tierKey === "silver";
              const minPrice = tierPkgs.length > 0 ? Math.min(...tierPkgs.map((p: any) => Number(p.base_price ?? p.price_per_unit) || Infinity)) : 0;

              return (
                <div
                  key={tierKey}
                  className={`group relative flex flex-col rounded-2xl md:rounded-3xl pt-9 pb-8 px-6 md:px-7 gap-5 transition-all duration-500 ${
                    featured
                      ? "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-xl md:shadow-2xl shadow-emerald-900/30 md:-translate-y-3 ring-2 ring-emerald-400/40"
                      : `${info.bgGradient} border-2 border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300`
                  }`}
                  data-scroll-animation="scroll-fade"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl md:rounded-t-3xl bg-gradient-to-r ${info.color}`} />

                  {featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <div className="rounded-full py-1.5 px-4 bg-amber-400 shadow-lg">
                        <div className="font-bold text-emerald-900 text-[11px] tracking-wider">⭐ PALING DIMINATI</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm tracking-wider ${featured ? "text-white/85" : "text-gray-500"}`}>
                      {info.badge}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={`${i < 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-black text-4xl md:text-5xl leading-none ${featured ? "text-white" : "text-[#0a1f18]"}`}>
                      {minPrice > 0 ? `Rp ${(minPrice / 1000).toFixed(0)}K` : "TBA"}
                    </span>
                    <span className={`text-sm ${featured ? "text-white/70" : "text-gray-500"}`}>mulai</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {info.features.map((feat, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                        featured ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {feat}
                      </span>
                    ))}
                  </div>

                  <div className={`w-full h-px ${featured ? "bg-white/20" : "bg-gradient-to-r from-gray-200 to-emerald-200"}`} />

                  <div className="flex flex-col gap-3 flex-1">
                    {tierPkgs.slice(0, 3).map((pkg: any) => (
                      <div key={pkg.id} className={`flex items-start gap-2 text-sm ${featured ? "text-white/90" : "text-gray-700"}`}>
                        <CheckCircle2 size={16} className={`mt-0.5 flex-shrink-0 ${featured ? "text-white/85" : "text-emerald-600"}`} />
                        <div className="min-w-0">
                          <span className="font-semibold">{pkg.name}</span>
                          <span className={`block text-xs ${featured ? "text-white/65" : "text-gray-500"}`}>
                            {formatRupiah(Number(pkg.base_price ?? pkg.price_per_unit) || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link href="/booking" className={`w-full text-center rounded-full py-3.5 px-6 font-bold transition-all transform hover:scale-[1.03] shadow-md ${
                    featured
                      ? "bg-white text-emerald-600 hover:bg-gray-50"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg"
                  }`}>
                    Pilih {tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
                  </Link>
                </div>
              );
            })}
          </div>

          <Link href="/booking" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all">
            Lihat semua paket →
          </Link>
        </section>

        {/* ===================== Video Section ===================== */}
        <section className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-12 md:gap-16 bg-white relative overflow-hidden">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-xs sm:text-[13px]">Saksikan Dampak Kami</div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-2xl sm:text-3xl md:text-[42px] leading-tight">Cerita Nyata dari Keluarga Kami</h2>
            <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed">Lihat bagaimana Penjaga Hati membuat perbedaan dalam kehidupan pasien dan keluarga mereka.</p>
          </div>

          <div className="w-full max-w-3xl relative group" data-scroll-animation="scroll-fade">
            <div className="relative w-full aspect-video bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-2xl md:rounded-3xl border-2 border-emerald-200/50 overflow-hidden shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-emerald-500/10 blur-3xl group-hover:animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-teal-500/10 blur-3xl group-hover:animate-pulse" style={{ animationDelay: "0.5s" }} />
                <button className="relative z-10 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/50 hover:shadow-xl hover:scale-110 transition-all transform group-hover:-translate-y-2 cursor-pointer">
                  <Play size={30} className="fill-white text-white ml-1" />
                </button>
              </div>
              <div className="hidden md:block absolute top-8 left-8 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float">
                👨‍⚕️ Perawat Profesional
              </div>
              <div className="hidden md:block absolute top-1/2 right-8 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float">
                💚 Pendampingan Penuh Hati
              </div>
              <div className="hidden md:block absolute bottom-8 left-1/4 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float">
                ⭐ Rating 4.9 / 5
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm max-w-lg">Putar video untuk mendengar langsung dari keluarga yang telah mempercayai kami.</p>
        </section>

        {/* ===================== CTA Section ===================== */}
        <section className="flex flex-col items-center w-full py-16 md:py-24 px-5 sm:px-8 md:px-20 gap-8 bg-gradient-to-r from-emerald-700 to-teal-600 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-1/2 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-64 md:w-80 h-64 md:h-80 bg-emerald-200 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center" data-scroll-animation="scroll-slide-up">
            <h2 className="tracking-tight text-center max-w-3xl font-bold text-white text-2xl sm:text-3xl md:text-[42px] leading-tight">Siap Memberikan Perhatian Terbaik untuk Orang Tersayang?</h2>
            <p className="text-center max-w-2xl text-white/80 text-base sm:text-lg leading-relaxed mt-4">Hubungi kami sekarang dan dapatkan konsultasi gratis. Tim kami siap membantu 24 jam.</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 relative z-10">
            <Link href="/booking" className="flex items-center justify-center rounded-full py-4 px-9 gap-2.5 bg-white text-emerald-700 hover:bg-gray-100 transition-all font-bold shadow-lg shadow-emerald-900/30 transform hover:-translate-y-1">
              <span>Mulai Sekarang</span><ArrowRight size={20} />
            </Link>
            <a href="https://wa.me/6285172081518?text=Halo%20Penjaga%20Hati,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20pendamping." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-full py-4 px-9 gap-2.5 border-2 border-white hover:bg-white/10 transition-all text-white font-semibold backdrop-blur-sm">
              <span>Daftar Sebagai Mitra</span>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
