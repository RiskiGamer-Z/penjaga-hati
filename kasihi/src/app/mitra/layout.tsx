"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  Wallet,
  UserCircle,
  Menu,
  LogOut,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function MitraLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<{ full_name: string, is_verified: boolean, avatar_url?: string | null } | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login?next=" + encodeURIComponent(pathname));
          return;
        }

        // Fetch user role from public.users table directly
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || profile.role !== 'mitra') {
          toast.error("Akses ditolak", "Halaman ini khusus untuk Mitra.");
          router.push("/auth/login");
          return;
        }

        const { data: mitraData } = await supabase
          .from('mitras')
          .select('id, is_verified, users!inner(full_name, avatar_url)')
          .eq('user_id', user.id)
          .single();

        if (mitraData) {
          const u = Array.isArray(mitraData.users) ? mitraData.users[0] : mitraData.users;
          setUserData({ full_name: u?.full_name || 'Mitra', is_verified: mitraData.is_verified, avatar_url: u?.avatar_url || null });
          setAuthorized(true);

          // Fetch badge count via server action
          const { getMitraOrdersAction } = await import('@/app/mitra/pesanan/actions');
          const res = await getMitraOrdersAction(mitraData.id, 'waiting_mitra');
          if (res.success && res.data) {
            setPendingCount(res.data.length);
          }
        } else {
          toast.error("Profil mitra tidak ditemukan.");
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname, router]);

  const menuItems = [
    { name: "Dashboard", href: "/mitra/dashboard", icon: LayoutDashboard },
    { name: "Pesanan Masuk", href: "/mitra/pesanan", icon: ClipboardList, badge: pendingCount },
    { name: "Riwayat", href: "/mitra/riwayat", icon: Clock },
    { name: "Pendapatan", href: "/mitra/pendapatan", icon: Wallet },
    { name: "Profil Saya", href: "/mitra/profil", icon: UserCircle },
  ];


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 font-sans antialiased">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1A2332] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
            } ${isSidebarExpanded ? "lg:w-72" : "lg:w-20"}`}
        >
          <div className="flex flex-col h-full py-6">
            {/* Logo Section */}
            <div className={`flex items-center px-6 gap-3 mb-8 transition-all duration-300 ${!isSidebarExpanded && "lg:px-5 lg:justify-center"}`}>
              <div className="relative w-10 h-10 bg-white rounded-xl p-1.5 shrink-0 shadow-lg shadow-white/10">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                <span className="font-bold text-white text-base leading-5 tracking-tight">Kasihi</span>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Portal Mitra</span>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col px-3 gap-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center rounded-xl py-3 px-4 gap-3 transition-all duration-200 group relative ${isActive
                        ? "bg-brand-evergreen/25 text-brand-evergreen shadow-inner border border-brand-evergreen/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                      } ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto"}`}
                  >
                    <div className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${!isActive && "group-hover:scale-110"}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    <span className={`font-semibold text-sm truncate flex-1 transition-all duration-300 ${isSidebarExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 lg:hidden"
                      }`}>
                      {item.name}
                    </span>

                    {item.badge && isSidebarExpanded && (
                      <span className="rounded-full py-0.5 px-2 text-[10px] font-black bg-brand-alpine text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for Collapsed Mode */}
                    {!isSidebarExpanded && (
                      <div className="absolute left-16 px-3 py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-2 group-hover:translate-x-0 transition-all whitespace-nowrap z-50 shadow-2xl border border-white/10 flex items-center gap-2">
                        {item.name}
                        {item.badge && <span className="w-2 h-2 rounded-full bg-brand-alpine" />}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Status */}
            <div className="mt-auto px-3 flex flex-col gap-3">
              <div className={`flex items-center rounded-xl py-2 px-3 gap-2 bg-brand-evergreen/20 border border-brand-evergreen/30 transition-all duration-300 ${!isSidebarExpanded && "lg:justify-center lg:w-14 lg:mx-auto"}`}>
                <div className="w-2 h-2 rounded-full bg-brand-evergreen animate-pulse shrink-0" />
                <span className={`font-semibold text-brand-evergreen text-xs whitespace-nowrap transition-all duration-300 ${isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"
                  }`}>
                  Status: Tersedia
                </span>
              </div>

              <div className={`flex items-center p-3 rounded-2xl bg-white/5 gap-3 transition-all duration-300 border border-white/5 hover:bg-white/10 cursor-pointer ${!isSidebarExpanded && "lg:justify-center lg:px-2 lg:w-14 lg:mx-auto"}`}>
                {userData?.avatar_url ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-inner border border-white/10">
                    <img src={userData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold shrink-0 shadow-inner text-sm">
                    {userData?.full_name ? userData.full_name.substring(0, 2).toUpperCase() : 'M'}
                  </div>
                )}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                  <span className="font-bold text-white text-xs tracking-tight truncate">{userData?.full_name || 'Memuat...'}</span>
                  <span className="text-white/40 text-[10px] font-medium truncate">{userData?.is_verified ? "Mitra Terverifikasi" : "Menunggu Verifikasi"}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className={`flex items-center rounded-xl py-2 px-4 gap-3 text-gray-400 hover:bg-white/5 hover:text-white transition-all group ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto"}`}
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className={`font-medium text-xs transition-all duration-300 ${isSidebarExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 lg:hidden"
                  }`}>
                  Keluar
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F3F4F6]">
          {/* Mobile Header */}
          <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-30 shadow-sm">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-brand-navy hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-navy tracking-tight">Portal Mitra</span>
            </div>

            <div className="w-10" />
          </header>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
  );
}
