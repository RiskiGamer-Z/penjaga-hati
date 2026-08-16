import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10 bg-white rounded-lg p-1">
                <Image src="/logo.png" alt="Kasihi Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-xl text-white">Kasihi</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Platform penyedia jasa pendamping pasien profesional di rumah sakit. Kami memberikan ketenangan bagi keluarga dan perawatan optimal bagi pasien.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="relative w-12 h-12 bg-white rounded-lg p-1 overflow-hidden shrink-0">
                <Image src="/logo TI.jpg" alt="Teknik Informatika UMK Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Didukung oleh</span>
                <span className="text-xs text-gray-200 font-bold leading-tight">Teknik Informatika UMK</span>
              </div>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-semibold mb-6">Perusahaan</h3>
            <ul className="space-y-4">
              <li><Link href="/#tentang" className="text-gray-300 hover:text-white text-sm transition-colors">Tentang Kami</Link></li>
              <li><a href="https://wa.me/6285172081518?text=Halo%20Kasihi,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20pendamping." target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm transition-colors">Karir Mitra</a></li>
              <li><Link href="/#kontak" className="text-gray-300 hover:text-white text-sm transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-semibold mb-6">Bantuan</h3>
            <ul className="space-y-4">
              <li><Link href="/#faq" className="text-gray-300 hover:text-white text-sm transition-colors">FAQ</Link></li>
              <li><Link href="/#panduan" className="text-gray-300 hover:text-white text-sm transition-colors">Panduan Pengguna</Link></li>
              <li><Link href="/#ketentuan" className="text-gray-300 hover:text-white text-sm transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/#privasi" className="text-gray-300 hover:text-white text-sm transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="font-semibold mb-6">Kontak</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-0.5">📞</span>
                <span>+62 813 2684 2285</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5">✉️</span>
                <span>official.penjagahati@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5">📍</span>
                <span>Jl. Yos Sudarso, Gg. 2 0486C RT 02 / Rw 04, Desa Burikan, Kec. Kota, Kab. Kudus </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Kasihi. Hak Cipta Dilindungi.
          </p>
          <div className="flex gap-4">
            <a 
              href="https://www.instagram.com/penjaga.hati_official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:text-pink-400 cursor-pointer transition-colors"
              title="Instagram Resmi Penjaga Hati"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
