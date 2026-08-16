'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Initialize scroll animations
    initAllScrollAnimations();

    // Initialize floating leaves and particles in hero
    const leafCleanup = initFloatingLeaves('floating-leaves');
    const particleCleanup = initParticles('hero-particles', 3);

    // Timeline hover effects
    const timelineNumbers = document.querySelectorAll('.timeline-number');
    timelineNumbers.forEach((number) => {
      const parent = number.closest('.timeline-item');
      if (parent) {
        parent.addEventListener('mouseenter', () => {
          number.classList.add('animate-shine', 'animate-shiftRight');
        });
        parent.addEventListener('mouseleave', () => {
          number.classList.remove('animate-shine', 'animate-shiftRight');
        });
      }
    });

    // Fetch Dynamic Data
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch Packages via Server Action to bypass RLS restrictions
      const res = await getHomePackagesAction();
      if (res.success && res.packages) {
        setPackages(res.packages);
      }

      // Fetch Stats
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: mitraCount } = await supabase.from('mitras').select('*', { count: 'exact', head: true });

      setStatsData({
        orders: (orderCount || 0) + 2400, // Offset with dummy for 'big' feel
        mitras: (mitraCount || 0) + 350
      });

      // Initialize counter animations for stats AFTER fetching
      setTimeout(() => initCounterAnimations(), 800);
    };

    fetchData();

    return () => {
      if (leafCleanup) leafCleanup();
      if (particleCleanup) particleCleanup();
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full bg-transparent font-sans antialiased">
        {/* Hero Section - Dark with Gradient */}
        <section
          className="relative w-full flex justify-center min-h-screen py-24 md:py-32 px-4 md:px-20 overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: 'linear-gradient(rgba(10, 31, 24, 0.75), rgba(10, 31, 24, 0.85)), url("/dashboard(2).png")' }}
        >
          {/* Floating Leaves Container */}
          <div id="floating-leaves" className="absolute inset-0 pointer-events-none" style={{ height: '100%' }} />

          {/* Particles Container */}
          <div id="hero-particles" className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none" />

          {/* Gradient Mesh Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-700/30 rounded-full blur-3xl opacity-40" />
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal-600/20 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="max-w-7xl w-full flex flex-col items-center justify-center z-10 relative text-center mt-10 md:mt-0">
            <div className="flex flex-col items-center gap-7 max-w-3xl mx-auto">
              {/* Animated Badge */}
              <div className="flex items-center justify-center w-fit mx-auto rounded-full py-2 px-4 gap-2 bg-emerald-500/15 border border-emerald-500/30 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="tracking-[0.04em] font-semibold text-emerald-400 text-[13px]">
                  LAYANAN PROFESIONAL 24/7
                </div>
              </div>

              {/* Hero Title */}
              <h1 className="tracking-tight font-bold text-white text-4xl md:text-6xl md:leading-[1.15] transform transition-all duration-700">
                Merawat dengan <span className="text-emerald-400">Sepenuh</span> <span className="text-red-400">Hati</span>
              </h1>

              <p className="text-white/80 text-lg md:text-xl leading-relaxed max-w-2xl font-light mx-auto">
                Kami hadir untuk mendampingi orang-orang tercinta Anda dengan empati, keahlian, dan dedikasi penuh — karena setiap pasien berhak mendapatkan perhatian terbaik.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
                <Link href="/booking" className="flex items-center rounded-full py-3.5 px-8 gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-900/40 transform hover:-translate-y-1 text-white font-semibold">
                  <span>Konsultasi Gratis</span>
                  <ArrowRight size={18} />
                </Link>
                <Link href="#layanan" className="flex items-center rounded-full py-3.5 px-8 gap-2.5 border-1.5 border-white/35 hover:bg-white/10 hover:border-white/60 transition-all text-white font-medium backdrop-blur-sm">
                  <span>Pelajari Lebih Lanjut</span>
                </Link>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center flex-wrap pt-10 gap-8 md:gap-16 opacity-90 mx-auto">
                <div className="flex flex-col items-center gap-1">
                  <div className="font-bold text-emerald-400 text-4xl md:text-5xl" data-counter={statsData.orders} data-counter-format="plus">0+</div>
                  <div className="font-medium text-white/70 text-sm mt-1">Pasien Terlayani</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden sm:block" />
                <div className="flex flex-col items-center gap-1">
                  <div className="font-bold text-emerald-400 text-4xl md:text-5xl" data-counter={statsData.mitras} data-counter-format="plus">0+</div>
                  <div className="font-medium text-white/70 text-sm mt-1">Tenaga Profesional</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden sm:block" />
                <div className="flex flex-col items-center gap-1">
                  <div className="font-bold text-emerald-400 text-4xl md:text-5xl" data-counter="4.9">0</div>
                  <div className="font-medium text-white/70 text-sm mt-1">Rating / 5</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layanan Kami - 6 Services */}
        <section id="layanan" className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-16 bg-gradient-to-b from-white to-emerald-50">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-[13px]">
              Apa yang Kami Tawarkan
            </div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-3xl md:text-[42px] leading-tight">
              Layanan Lengkap untuk Setiap Kebutuhan
            </h2>
            <p className="text-gray-600 text-[17px] leading-relaxed">
              Dari perawatan harian hingga pendampingan pasca-operasi, tim kami siap memberikan bantuan terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-6xl gap-6" data-stagger-animation="scroll-slide-up" data-stagger-delay="100">
            {[
              { icon: "🏥", title: "Pendampingan Rawat Inap", desc: "Penjaga profesional mendampingi pasien di rumah sakit, memastikan kenyamanan dan keamanan 24 jam penuh." },
              { icon: "👶", title: "Perawatan Lansia", desc: "Pendekatan penuh empati untuk orang tua lanjut usia, mencakup aktivitas sosial, nutrisi, dan mobilisasi." },
              { icon: "🧠", title: "Pendampingan Mental", desc: "Dukungan psikososial dan emosional bagi pasien dalam proses pemulihan panjang maupun kondisi kronis." },
              { icon: "🚑", title: "Respon Darurat", desc: "Tim siaga yang dapat ditugaskan dalam waktu singkat untuk situasi medis yang membutuhkan penanganan cepat." },
              { icon: "📋", title: "Konsultasi & Rencana Rawat", desc: "Asesmen kondisi pasien dan penyusunan rencana perawatan personal bersama dokter dan keluarga." }
            ].map((service, idx) => (
              <div
                key={idx}
                data-stagger-item
                className="group flex flex-col rounded-2xl py-8 px-6 gap-4 bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Bottom accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 transform origin-left scale-x-100 md:scale-x-0 md:group-hover:scale-x-100 transition-transform duration-300" />

                <div className="text-4xl">{service.icon}</div>
                <h3 className="font-bold text-[#0a1f18] text-lg">{service.title}</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed flex-1">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara Kerja - Timeline */}
        <section
          className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-16 relative overflow-hidden bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'linear-gradient(rgba(10, 31, 24, 0.85), rgba(10, 31, 24, 0.95)), url("/dashboard(2).png")' }}
        >
          {/* Gradient overlays */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/12 w-80 h-80 bg-emerald-900/40 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-1/3 right-1/6 w-96 h-96 bg-teal-800/30 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="flex flex-col items-center max-w-2xl gap-4 text-center relative z-10" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-400 text-[13px]">
              Cara Kerja
            </div>
            <h2 className="tracking-tight font-bold text-white text-3xl md:text-[42px] leading-tight">
              Mulai dalam 4 Langkah Mudah
            </h2>
            <p className="text-white/55 text-[17px] leading-relaxed">
              Proses kami dirancang agar cepat, transparan, dan berpusat pada kebutuhan pasien serta keluarga.
            </p>
          </div>

          <div className="w-full max-w-2xl relative z-10" data-stagger-animation="scroll-slide-up" data-stagger-delay="150">
            {/* Timeline line - Perfectly centered with circles */}
            <div className="absolute left-6 top-14 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-500" />

            <div className="flex flex-col gap-12">
              {[
                {
                  num: "1",
                  title: "Konsultasi Awal",
                  desc: "Hubungi kami melalui telepon, WhatsApp, atau website. Tim kami akan mendengarkan kebutuhan Anda dan menjawab setiap pertanyaan secara gratis."
                },
                {
                  num: "2",
                  title: "Asesmen Kebutuhan",
                  desc: "Koordinator kami akan melakukan penilaian kondisi pasien — baik secara langsung maupun daring — untuk menyusun rencana perawatan yang tepat."
                },
                {
                  num: "3",
                  title: "Penugasan Penjaga Profesional",
                  desc: "Kami mencocokkan pasien dengan penjaga yang paling sesuai berdasarkan keahlian, kepribadian, dan lokasi untuk memastikan kecocokan terbaik."
                },
                {
                  num: "4",
                  title: "Pemantauan Berkelanjutan",
                  desc: "Supervisor kami memantau kualitas layanan secara rutin dan keluarga dapat mengakses laporan perkembangan pasien kapan saja."
                }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-6 group timeline-item cursor-pointer transition-all" data-stagger-item>
                  {/* Timeline circle - w-14 = 56px, center at left-7 */}
                  <div className="relative z-20 flex-shrink-0">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-base border-4 border-[#0a1f18] shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/50 transition-all transform group-hover:scale-110 timeline-number">
                      {step.num}
                    </div>
                  </div>

                  {/* Content - Text with animations */}
                  <div className="flex-1 pt-1 group-hover:translate-x-1 transition-transform duration-300">
                    <h3 className="font-bold text-white text-lg mb-2.5 group-hover:animate-shine">{step.title}</h3>
                    <p className="text-white/70 text-[15px] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimoni */}
        <section className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-16 bg-white">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-[13px]">
              Testimoni Keluarga
            </div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-3xl md:text-[42px] leading-tight">
              Kepercayaan yang Kami Jaga
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-6xl gap-6" data-stagger-animation="scroll-slide-up" data-stagger-delay="100">
            {[
              {
                text: `"Pendamping dari Kasihi sangat sabar dan profesional. Ibu saya merasa nyaman dan keluarga kami tenang meninggalkan beliau dalam perawatan mereka."`,
                name: "Ratna Dewi", location: "Semarang", initials: "R",
                bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600"
              },
              {
                text: `"Proses pendaftarannya mudah dan cepat. Dalam 2 jam sudah ada penjaga yang datang ke rumah sakit. Sangat responsif dan terpercaya."`,
                name: "Budi Santoso", location: "Solo", initials: "B",
                bgColor: "bg-gradient-to-br from-emerald-600 to-emerald-400"
              },
              {
                text: `"Layanan perawatan lansia mereka luar biasa. Ayah saya yang mengalami demensia ditangani dengan sangat telaten dan penuh kasih sayang."`,
                name: "Siti Mariam", location: "Yogyakarta", initials: "S",
                bgColor: "bg-gradient-to-br from-teal-500 to-emerald-700"
              }
            ].map((testi, idx) => (
              <div key={idx} className="group flex flex-col rounded-2xl py-8 px-7 gap-5 bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden" data-stagger-item>
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="italic text-gray-700 text-[15px] leading-relaxed flex-1 font-light">
                  {testi.text}
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className={`flex items-center justify-center rounded-full w-12 h-12 text-white font-bold text-sm ${testi.bgColor} shadow-lg`}>
                    {testi.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0a1f18] text-[15px]">{testi.name}</span>
                    <span className="text-gray-500 text-[13px]">{testi.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="harga" className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-16 bg-gradient-to-b from-emerald-50 to-white">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-[13px]">
              Paket Layanan
            </div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-3xl md:text-[42px] leading-tight">
              Pilih Durasi Pendampingan
            </h2>
            <p className="text-gray-600 text-[17px] leading-relaxed">
              Sesuaikan durasi pendampingan dengan kebutuhan Anda. Semua paket sudah termasuk mitra terverifikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-6xl gap-6" data-stagger-animation="scroll-scale" data-stagger-delay="120">
            {packages.length > 0 ? packages.map((pkg, idx) => (
              <div key={pkg.id} className={`group flex flex-col rounded-2xl py-10 px-8 gap-6 relative overflow-hidden transition-all duration-300 ${idx === 1 ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-xl shadow-emerald-900/30 transform md:-translate-y-4' : 'bg-white border border-gray-200 hover:shadow-xl hover:border-emerald-200'}`} data-stagger-item>
                {idx === 1 && (
                  <div className="absolute top-4 right-4 rounded-full py-1.5 px-4 bg-amber-400/90 backdrop-blur-sm">
                    <div className="font-bold text-emerald-900 text-xs tracking-wide">⭐ POPULER</div>
                  </div>
                )}
                <div className={`tracking-[0.04em] uppercase font-semibold text-sm relative z-10 ${idx === 1 ? 'text-white/80' : 'text-emerald-600'}`}>
                  {pkg.name}
                </div>
                <div className="flex items-baseline gap-1 relative z-10">
                  <div className={`font-bold text-4xl ${idx === 1 ? 'text-white' : 'text-[#0a1f18]'}`}>
                    Rp {(pkg.base_price / 1000).toFixed(0)}K
                  </div>
                  <div className={`font-medium text-base ${idx === 1 ? 'text-white/70' : 'text-gray-600'}`}>
                    /{pkg.duration_hours || 4} jam
                  </div>
                </div>
                <div className={`w-full h-px ${idx === 1 ? 'bg-white/20' : 'bg-gradient-to-r from-gray-200 to-emerald-200'}`} />
                <div className="flex flex-col gap-4 flex-1 relative z-10">
                  <div className={`flex items-center gap-3 text-sm ${idx === 1 ? 'text-white/90' : 'text-gray-700'}`}>
                    <CheckCircle2 size={18} className={idx === 1 ? "text-white/90" : "text-emerald-600"} />
                    <span>Mitra terverifikasi</span>
                  </div>
                  <div className={`flex items-center gap-3 text-sm ${idx === 1 ? 'text-white/90' : 'text-gray-700'}`}>
                    <CheckCircle2 size={18} className={idx === 1 ? "text-white/90" : "text-emerald-600"} />
                    <span>Update kondisi real-time</span>
                  </div>
                  <p className={`text-xs italic ${idx === 1 ? 'text-white/60' : 'text-gray-400'}`}>
                    {pkg.description || "Layanan pendampingan profesional."}
                  </p>
                </div>
                <Link href="/booking" className={`rounded-full py-3 px-6 text-center font-semibold transition-all mt-auto relative z-10 transform hover:scale-105 shadow-sm ${idx === 1 ? 'bg-white text-emerald-600 hover:bg-gray-100' : 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'}`}>
                  Pilih Paket
                </Link>
              </div>
            )) : (
              // Fallback if no packages in DB
              <div className="col-span-3 text-center py-10 text-gray-500">Memuat paket layanan...</div>
            )}
          </div>
        </section>

        {/* Video Section */}
        <section className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-16 bg-white relative overflow-hidden">
          <div className="flex flex-col items-center max-w-2xl gap-4 text-center" data-scroll-animation="scroll-slide-up">
            <div className="tracking-[0.08em] uppercase font-semibold text-emerald-600 text-[13px]">
              Saksikan Dampak Kami
            </div>
            <h2 className="tracking-tight font-bold text-[#0a1f18] text-3xl md:text-[42px] leading-tight">
              Cerita Nyata dari Keluarga Kami
            </h2>
            <p className="text-gray-600 text-[17px] leading-relaxed">
              Lihat bagaimana Kasihi membuat perbedaan dalam kehidupan pasien dan keluarga mereka.
            </p>
          </div>

          <div className="w-full max-w-3xl relative group" data-scroll-animation="scroll-fade">
            {/* Video Container with floating elements */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-3xl border-2 border-emerald-200/50 overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-300">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                {/* Floating circles */}
                <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-emerald-500/10 blur-3xl group-hover:animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-teal-500/10 blur-3xl group-hover:animate-pulse" style={{ animationDelay: '0.5s' }} />

                {/* Play Button */}
                <button className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/50 hover:shadow-xl hover:scale-110 transition-all transform group-hover:-translate-y-2 cursor-pointer">
                  <Play size={32} className="fill-white text-white ml-1" />
                </button>
              </div>

              {/* Floating UI Elements */}
              <div className="absolute top-8 left-8 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float" style={{ animation: 'float 4s ease-in-out infinite' }}>
                👨‍⚕️ Perawat Profesional
              </div>
              <div className="absolute top-1/2 right-8 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float" style={{ animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}>
                💚 Perawatan Penuh Hati
              </div>
              <div className="absolute bottom-8 left-1/4 bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white font-medium whitespace-nowrap animate-float" style={{ animation: 'float 4.5s ease-in-out infinite', animationDelay: '0.3s' }}>
                ⭐ Rating 4.9 / 5
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm max-w-lg">
            Putar video untuk mendengar langsung dari keluarga yang telah mempercayai kami dalam perjalanan perawatan mereka.
          </p>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center w-full py-24 px-4 md:px-20 gap-8 bg-gradient-to-r from-emerald-700 to-teal-600 relative overflow-hidden">
          {/* Gradient mesh background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-200 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10" data-scroll-animation="scroll-slide-up">
            <h2 className="tracking-tight text-center max-w-3xl font-bold text-white text-3xl md:text-[42px] leading-tight">
              Siap Memberikan Perhatian Terbaik untuk Orang Tersayang?
            </h2>
            <p className="text-center max-w-2xl text-white/80 text-lg leading-relaxed mt-4">
              Hubungi kami sekarang dan dapatkan konsultasi gratis. Tim kami siap membantu 24 jam, 7 hari seminggu.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6 relative z-10" data-stagger-animation="scroll-fade" data-stagger-delay="100">
            <Link href="/booking" className="flex items-center rounded-full py-4 px-9 gap-2.5 bg-white text-emerald-700 hover:bg-gray-100 transition-all font-bold shadow-lg shadow-emerald-900/30 transform hover:-translate-y-1" data-stagger-item>
              <span>Mulai Sekarang</span>
              <ArrowRight size={20} />
            </Link>
            <a href="https://wa.me/6285172081518?text=Halo%20Penjaga%20Hati,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20pendamping." target="_blank" rel="noopener noreferrer" className="flex items-center rounded-full py-4 px-9 gap-2.5 border-2 border-white hover:bg-white/10 transition-all text-white font-semibold backdrop-blur-sm" data-stagger-item>
              <span>Daftar Sebagai Mitra</span>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

