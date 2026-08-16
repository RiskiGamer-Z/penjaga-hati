"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { LogOut, ChevronDown, LayoutDashboard, Menu, X, Settings } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('users').select('role, full_name, avatar_url').eq('id', session.user.id).single();
        let userRole = data?.role;
        let name = data?.full_name;
        let avatar = data?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

        if (session.user.email === 'admin@penjagahati.com') {
          userRole = 'admin';
        }

        if (data) {
          setRole(userRole);
          setUserName(name || session.user.email?.split('@')[0] || 'User');
          setAvatarUrl(avatar || null);
        } else {
          setRole(userRole);
          setUserName(session.user.email?.split('@')[0] || 'User');
          setAvatarUrl(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setRole(null);
        setUserName('');
        setAvatarUrl(null);
      } else if (session.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll effects - shadow & progress bar
  useEffect(() => {
    const handleScroll = () => {
      // Navbar shadow on scroll
      setScrolled(window.scrollY > 10);
      
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'mitra') return '/mitra/dashboard';
    return '/user/dashboard';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userInitials = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <nav className={`fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-lg' : 'shadow-none'}`}>
      {/* Progress bar */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"
        style={{ width: `${scrollProgress}%`, transition: 'width 0.1s ease-out' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Kasihi Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-xl text-brand-navy">Kasihi</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="relative text-sm font-medium text-brand-evergreen group">
              Beranda
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-evergreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link href="/#profil" className="relative text-sm font-medium text-gray-600 hover:text-brand-evergreen transition-colors group">
              Profil
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-evergreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link href="/#harga" className="relative text-sm font-medium text-gray-600 hover:text-brand-evergreen transition-colors group">
              Harga
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-evergreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link href="/booking" className="relative text-sm font-medium text-gray-600 hover:text-brand-evergreen transition-colors group">
              Pesan Pendamping
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-evergreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </div>

          {/* Desktop CTA & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-32 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-evergreen/20"
                >
                  {avatarUrl ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100">
                      <img src={avatarUrl} alt={userName} className="w-full h-full object-cover rounded-full" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-evergreen text-white font-bold text-sm shrink-0">
                      {userInitials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-brand-navy max-w-[100px] truncate">
                    {userName}
                  </span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-500 mb-0.5">Masuk sebagai</p>
                      <p className="text-sm font-semibold text-brand-navy truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                      href={getDashboardLink()} 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-evergreen transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      <span className="font-medium">Dashboard</span>
                    </Link>

                    {(role === 'user' || !role) && (
                      <Link 
                        href="/user/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-evergreen transition-colors"
                      >
                        <Settings size={16} />
                        <span className="font-medium">Pengaturan Akun</span>
                      </Link>
                    )}
                    
                    <div className="h-px bg-gray-50 my-1 w-full" />
                    
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span className="font-medium">Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-brand-navy hover:text-brand-evergreen transition-colors">
                  Masuk
                </Link>
                <Link href="/auth/register" className="px-5 py-2.5 rounded-full bg-brand-evergreen text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200">
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-brand-evergreen focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full animate-in slide-in-from-top-4 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
              Beranda
            </Link>
            <Link href="/#profil" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
              Profil
            </Link>
            <Link href="/#harga" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
              Harga
            </Link>
            <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
              Pesan Pendamping
            </Link>

            <div className="h-px bg-gray-100 my-4" />

            {isLoading ? (
              <div className="space-y-3 px-3 pt-2">
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="space-y-1">
                <div className="px-3 flex items-center gap-3 mb-3">
                  {avatarUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                      <img src={avatarUrl} alt={userName} className="w-full h-full object-cover rounded-full" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-evergreen text-white font-bold text-lg shrink-0">
                      {userInitials}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-brand-navy">{userName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
                {(role === 'user' || !role) && (
                  <Link href="/user/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-brand-navy hover:text-brand-evergreen hover:bg-gray-50 rounded-lg">
                    <Settings size={20} />
                    Pengaturan Akun
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut size={20} />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-3 pt-2">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 text-brand-evergreen font-semibold border border-brand-evergreen rounded-xl hover:bg-emerald-50 transition-colors">
                  Masuk
                </Link>
                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 bg-brand-evergreen text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200">
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
