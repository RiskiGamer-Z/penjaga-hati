"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCircle, 
  CreditCard, 
  Menu,
  LogOut,
  Loader2,
  ShieldCheck,
  MessageSquare
} from "lucide-react";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const showText = isSidebarExpanded || isMobileMenuOpen;

  const [ownerUser, setOwnerUser] = useState<{ id: string; name: string; email: string; initials: string; avatarUrl?: string | null } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [stats, setStats] = useState({
    pendingWithdrawals: 0,
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
          .select('id, full_name, email, avatar_url')
          .eq('id', user.id)
          .single();
        
        const name = profile?.full_name || user.email || 'Owner';
        const email = profile?.email || user.email || '';
        const avatarUrl = profile?.avatar_url || null;
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        
        setOwnerUser({ id: profile?.id || user.id, name, email, initials, avatarUrl });
      }

      // Fetch sidebar badge counts
      const { count: pendingWithdrawalsCount } = await supabase
        .from('mitra_withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingMitraCount } = await supabase
        .from('mitras')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      setStats({
        pendingWithdrawals: pendingWithdrawalsCount || 0,
        pendingMitra: pendingMitraCount || 0
      });
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
        { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Keuangan",
      items: [
        { name: "Keuangan & Payout", href: "/owner/keuangan", icon: CreditCard, badge: stats.pendingWithdrawals, badgeColor: "bg-red-500" },
      ]
    },
    {
      title: "Operasional & Monitoring",
      items: [
        { name: "Semua Pesanan", href: "/owner/pesanan", icon: FileText },
      ]
    },
    {
      title: "Manajemen Pengguna",
      items: [
        { name: "Kelola Mitra", href: "/owner/mitra", icon: Users, badge: stats.pendingMitra, badgeColor: "bg-amber-500" },
        { name: "Kelola Pengguna", href: "/owner/pengguna", icon: UserCircle },
        { name: "Kinerja & Kelola Admin", href: "/owner/admins", icon: ShieldCheck },
      ]
    },
    {
      title: "Umpan Balik",
      items: [
        { name: "Kritik & Saran", href: "/owner/kritik-saran", icon: MessageSquare },
      ]
    }
  ];

  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
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
              <div className="relative w-10 h-10 bg-white rounded-xl p-1.5 shrink-0 shadow-lg shadow-white/10 ring-1 ring-white/20">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showText ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                <span className="font-bold text-white text-base leading-5 tracking-tight">Kasihi</span>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Owner Panel</span>
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
                        className={`flex items-center rounded-xl py-3 px-4 gap-3 transition-all duration-200 group relative ${
                          isActive 
                            ? "bg-brand-evergreen text-white shadow-lg shadow-emerald-900/40 ring-1 ring-white/10" 
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                        } ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto"}`}
                      >
                        <div className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${!isActive && "group-hover:scale-110"}`}>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        
                        <span className={`font-bold text-sm truncate flex-1 transition-all duration-300 ${
                          showText ? "opacity-100 w-auto ml-1" : "opacity-0 w-0 lg:hidden"
                        }`}>
                          {item.name}
                        </span>

                        {/* Badge */}
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
              <div className={`flex items-center p-3 rounded-2xl bg-white/5 gap-3 transition-all duration-300 border border-white/5 ${!isSidebarExpanded && "lg:justify-center lg:px-2"}`}>
                {ownerUser?.avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
                    <img src={ownerUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-evergreen to-emerald-400 flex items-center justify-center text-white font-black shrink-0 border-2 border-white/10 shadow-lg text-sm">
                    {ownerUser?.initials || 'OW'}
                  </div>
                )}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showText ? "opacity-100 w-auto" : "opacity-0 w-0 lg:hidden"}`}>
                  <span className="font-black text-white text-xs tracking-tight truncate max-w-[140px]">
                    {ownerUser?.name || 'Owner'}
                  </span>
                  <span className="text-white/30 text-[10px] font-medium truncate italic max-w-[140px]">
                    {ownerUser?.email || ''}
                  </span>
                </div>
              </div>
               
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex items-center rounded-xl py-3 px-4 gap-3 text-red-400 hover:bg-red-500/10 transition-all group disabled:opacity-60 ${!isSidebarExpanded && "lg:justify-center lg:px-0 lg:w-14 lg:mx-auto"}`}
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
          <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-30">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-brand-navy hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              <Menu size={26} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-brand-navy tracking-tight text-lg">Kasihi</span>
            </div>
            
            <div className="w-10" />
          </header>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB]">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
