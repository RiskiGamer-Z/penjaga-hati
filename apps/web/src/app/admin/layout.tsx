"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getAdminSidebarStatsAction } from "@/app/admin/pesanan/actions";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCircle, 
  CreditCard, 
  BarChart2, 
  Hospital,
  Menu,
  LogOut,
  MessageSquare,
  Settings,
  Package,
  Loader2,
  ShieldAlert
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const showText = isSidebarExpanded || isMobileMenuOpen;

  // Admin user profile from session
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; initials: string; avatarUrl?: string | null } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [stats, setStats] = useState({
    pendingOrders: 0,
    pendingPayments: 0,
    pendingMitra: 0
  });

  useEffect(() => {
    const init = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      // Fetch logged-in user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single();
        
        const name = profile?.full_name || user.email || 'Admin';
        const email = profile?.email || user.email || '';
        const avatarUrl = profile?.avatar_url || null;
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        
        setAdminUser({ name, email, initials, avatarUrl });
      }

      // Fetch sidebar badge counts via Server Action to bypass client-side RLS
      const res = await getAdminSidebarStatsAction();
      if (res.success && res.data) {
        setStats({
          pendingOrders: res.data.pendingOrders,
          pendingPayments: res.data.pendingPayments,
          pendingMitra: res.data.pendingMitra
        });
      }
    };
    init();
  }, []);


  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  };

  type NavSection = {
    title: string;
    items: NavItem[];
  };

  const sections: NavSection[] = [
    {
      title: "Utama",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Operasional",
      items: [
        { name: "Pesanan", href: "/admin/pesanan", icon: FileText, badge: stats.pendingOrders, badgeColor: "bg-brand-alpine" },
        { name: "Pembayaran", href: "/admin/verifikasi", icon: CreditCard, badge: stats.pendingPayments, badgeColor: "bg-red-500" },
      ]
    },
    {
      title: "Manajemen Data",
      items: [
        { name: "Mitra", href: "/admin/mitra", icon: Users, badge: stats.pendingMitra, badgeColor: "bg-brand-alpine" },
        { name: "Pengguna", href: "/admin/pengguna", icon: UserCircle },
        { name: "Rumah Sakit", href: "/admin/hospitals", icon: Hospital },
        { name: "Paket Layanan", href: "/admin/packages", icon: Package },
      ]
    },
    {
      title: "Feedback & Analitik",
      items: [
        { name: "Ulasan", href: "/admin/reviews", icon: MessageSquare },
        { name: "Laporan", href: "/admin/laporan", icon: BarChart2 },
      ]
    },
    {
      title: "Sistem",
      items: [
        { name: "Pengaturan", href: "/admin/settings", icon: Settings },
      ]
    }
  ];



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
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-navy transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:relative lg:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
          } ${isSidebarExpanded ? "lg:w-72" : "lg:w-20"}`}
        >
          <div className="flex flex-col h-full py-6">
            {/* Logo Section */}
            <div className={`flex items-center px-6 gap-3 mb-8 transition-all duration-300 ${!isSidebarExpanded && "lg:px-5 lg:justify-center"}`}>
              <div className="relative w-[52px] h-[52px] bg-white rounded-lg p-1.5 shrink-0 border border-white/10 shadow-sm">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showText ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                <span className="font-sans font-bold text-white text-lg leading-5 tracking-tight">Penjaga Hati</span>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Admin Panel</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col px-3 gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="flex flex-col gap-1.5">
                  {showText && (
                    <span className="px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">
                      {section.title}
                    </span>
                  )}
                  {!showText && <div className="h-px bg-white/5 mx-2 my-1" />}
                  
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center rounded py-2.5 px-4 gap-3 transition-all duration-200 group relative ${
                          isActive 
                            ? "bg-white/10 text-white border-l-2 border-brand-evergreen" 
                            : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                        } ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto lg:border-l-0"}`}
                      >
                        <div className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${!isActive && "group-hover:scale-110"}`}>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        
                        <span className={`font-bold text-sm truncate flex-1 transition-all duration-300 ${
                          showText ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 lg:hidden"
                        }`}>
                          {item.name}
                        </span>

                        {/* Badge — tanpa animate-pulse */}
                        {item.badge !== undefined && item.badge > 0 && showText && (
                          <span className={`rounded-full py-0.5 px-2 text-[10px] font-black ${
                            isActive ? "bg-white text-brand-evergreen" : `${item.badgeColor} text-white`
                          }`}>
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip for Collapsed Mode */}
                        {!isSidebarExpanded && (
                          <div className="absolute left-16 px-3 py-2 bg-gray-900 text-white text-[11px] font-black rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-2 group-hover:translate-x-0 transition-all whitespace-nowrap z-50 shadow-2xl border border-white/10 flex items-center gap-2">
                            {item.name}
                            {item.badge !== undefined && item.badge > 0 && <span className={`w-2 h-2 rounded-full ${item.badgeColor}`} />}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* User Profile & Logout */}
            <div className="mt-auto pt-4 px-3 flex flex-col gap-2 border-t border-white/5 mt-6">
              <div className={`flex items-center p-3 rounded bg-white/5 gap-3 transition-all duration-300 border border-white/5 ${!isSidebarExpanded && "lg:justify-center lg:px-2"}`}>
                {adminUser?.avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
                    <img src={adminUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-evergreen to-emerald-400 flex items-center justify-center text-white font-black shrink-0 border-2 border-white/10 shadow-lg text-sm">
                    {adminUser?.initials || 'AD'}
                  </div>
                )}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showText ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                  <span className="font-black text-white text-xs tracking-tight truncate max-w-[140px]">
                    {adminUser?.name || 'Admin'}
                  </span>
                  <span className="text-white/30 text-[10px] font-medium truncate italic max-w-[140px]">
                    {adminUser?.email || ''}
                  </span>
                </div>
              </div>
               
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex items-center rounded py-2.5 px-4 gap-3 text-red-400 hover:bg-red-500/10 transition-all group disabled:opacity-60 ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto"}`}
              >
                {isLoggingOut 
                  ? <Loader2 size={20} className="animate-spin" />
                  : <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                }
                <span className={`font-black text-sm transition-all duration-300 ${
                  showText ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 lg:hidden"
                }`}>
                  {isLoggingOut ? 'Keluar...' : 'Keluar'}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Header */}
          <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-30">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-brand-navy hover:bg-gray-100 rounded transition-all active:scale-95"
            >
              <Menu size={26} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-brand-navy tracking-tight text-lg">Penjaga Hati</span>
            </div>
            
            <div className="w-10" />
          </header>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB]">
            {children}
          </div>
        </main>
      </div>
  );
}
