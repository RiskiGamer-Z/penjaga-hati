"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Jangan tampilkan widget di halaman admin, mitra, owner, atau auth
  const isHidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mitra") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/auth");

  if (isHidden) return null;

  const csList = [
    {
      initials: "A1",
      badge: "Admin 1",
      name: "Fadil",
      role: "Admin Utama",
      desc: "Layanan, Pemesanan & Info Paket",
      phone: "+62 851-7208-1518",
      url: "https://wa.me/6285172081518?text=Halo%20Penjaga%20Hati,%20saya%20butuh%20informasi%20mengenai%20layanan%20pendampingan.",
    },
    {
      initials: "A2",
      badge: "Admin 2",
      name: "Admin Operasional",
      role: "Admin Pendukung",
      desc: "Bantuan, Kendala & Follow-up",
      phone: "+62 851-7208-1519",
      url: "https://wa.me/6285172081519?text=Halo%20Penjaga%20Hati,%20saya%20butuh%20bantuan%20operasional%20pendampingan.",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans antialiased">
      {/* Pop-up Chat Box */}
      <div
        className={`absolute bottom-20 right-0 w-96 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.579 2.022 14.103.999 11.487 1c-5.438 0-9.864 4.372-9.868 9.802-.001 1.764.485 3.487 1.409 5.014L2.016 20.8l5.086-1.326z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-[16px]">Butuh Bantuan?</h4>
              <p className="text-[12px] text-white/80">CS Penjaga Hati siap mendampingi Anda 24 jam</p>
            </div>
          </div>
        </div>

        {/* CS List - Admin 1 & 2 */}
        <div className="p-4 bg-gray-50 flex flex-col gap-3 max-h-[340px] overflow-y-auto">
          {csList.map((cs, index) => (
            <a
              key={index}
              href={cs.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all group decoration-none"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 relative">
                <span className="text-emerald-700 font-extrabold text-sm group-hover:scale-110 transition-transform">
                  {cs.initials}
                </span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {cs.badge}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">Online</span>
                </div>
                <p className="font-bold text-[14px] text-brand-navy truncate mt-1">{cs.name}</p>
                <p className="text-[11.5px] text-gray-500 font-medium">{cs.role}</p>
                <p className="text-[11px] text-gray-400 truncate">{cs.desc}</p>
                <p className="text-[12px] text-brand-evergreen font-bold mt-0.5">{cs.phone}</p>
              </div>
              <svg className="w-5 h-5 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.579 2.022 14.103.999 11.487 1c-5.438 0-9.864 4.372-9.868 9.802-.001 1.764.485 3.487 1.409 5.014L2.016 20.8l5.086-1.326z"/>
              </svg>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 text-center bg-white border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">Aktif 24 Jam • Respon cepat & ramah</p>
        </div>
      </div>

      {/* Floating Button - Lebih besar */}
      <div className="relative">
        <span className={`absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 ${isOpen ? "hidden" : ""}`} />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? "bg-brand-navy text-white hover:bg-brand-navy/90 rotate-90"
              : "bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:-translate-y-1 hover:shadow-2xl shadow-emerald-500/30"
          }`}
          aria-label="Hubungi WhatsApp CS"
        >
          {isOpen ? (
            <X size={26} />
          ) : (
            <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.579 2.022 14.103.999 11.487 1c-5.438 0-9.864 4.372-9.868 9.802-.001 1.764.485 3.487 1.409 5.014L2.016 20.8l5.086-1.326z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
