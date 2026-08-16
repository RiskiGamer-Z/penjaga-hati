"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { verifyAndGetUserRole } from "@/app/auth/actions";
import { toast } from "@/utils/toast";
import { motion, AnimatePresence } from "framer-motion";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ("user" | "mitra" | "admin" | "owner")[];
  fallbackUrl?: string;
}

export default function RoleGuard({ children, allowedRoles, fallbackUrl }: RoleGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const validateRole = async () => {
      try {
        const result = await verifyAndGetUserRole();

        if (!result.success || !result.role) {
          if (isMounted) {
            if (result.error && !result.error.includes("Sesi telah berakhir")) {
              toast.error("Gagal memverifikasi akun", result.error);
            }
            const loginUrl = new URL("/auth/login", window.location.origin);
            loginUrl.searchParams.set("next", pathname);
            router.push(loginUrl.pathname + loginUrl.search);
          }
          return;
        }

        const role = result.role as "user" | "mitra" | "admin" | "owner";

        // Validate allowed roles
        if (allowedRoles.includes(role)) {
          if (isMounted) {
            setIsAuthorized(true);
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            toast.warning("Akses Ditolak", "Anda tidak memiliki wewenang untuk mengakses halaman ini.");
            
            // Redirect to appropriate dashboard based on user's actual role
            if (fallbackUrl) {
              router.push(fallbackUrl);
            } else if (role === "owner") {
              router.push("/owner/dashboard");
            } else if (role === "admin") {
              router.push("/admin/dashboard");
            } else if (role === "mitra") {
              router.push("/mitra/dashboard");
            } else {
              router.push("/user/dashboard");
            }
          }
        }
      } catch (err) {
        console.error("Error in RoleGuard:", err);
        if (isMounted) {
          toast.error("Error Sistem", "Terjadi kesalahan saat memvalidasi otorisasi.");
          router.push("/auth/login");
        }
      }
    };

    validateRole();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, fallbackUrl, router]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl"
        >
          <div className="relative flex flex-col items-center p-8 rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl max-w-sm w-full mx-4">
            {/* Ambient background glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-brand-evergreen/20 via-brand-alpine/5 to-transparent rounded-3xl blur-2xl" />

            {/* Spinner animated with pure CSS / framer-motion */}
            <div className="relative w-16 h-16 mb-6">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-slate-800"
                style={{ borderTopColor: "var(--color-brand-evergreen, #10B981)" }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              />
              <div className="absolute inset-2 rounded-full bg-slate-950/80 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-evergreen animate-pulse" />
              </div>
            </div>

            <h3 className="text-white font-bold text-lg mb-1 tracking-tight text-center">Memverifikasi Akses</h3>
            <p className="text-slate-400 text-xs text-center font-medium">Mohon tunggu sebentar, kami sedang mengamankan sesi Anda...</p>
          </div>
        </motion.div>
      ) : isAuthorized ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
