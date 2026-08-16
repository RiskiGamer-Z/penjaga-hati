"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { verifyAndGetUserRole } from "@/app/auth/actions";
import { toast } from "@/utils/toast";
import { useLoading } from "@/components/ui/GlobalLoadingOverlay";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ("user" | "mitra" | "admin" | "owner")[];
  fallbackUrl?: string;
}

export default function RoleGuard({ children, allowedRoles, fallbackUrl }: RoleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { startLoading, stopLoading } = useLoading();

  // Stabilkan dependency: gabungkan roles jadi string agar useEffect tidak
  // dipicu ulang oleh array literal baru setiap render (penyebab loop verifikasi).
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    let isMounted = true;
    startLoading("Memverifikasi akses...");

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
        const allowed = rolesKey.split(",");

        if (allowed.includes(role)) {
          if (isMounted) {
            setIsAuthorized(true);
          }
        } else {
          if (isMounted) {
            toast.warning("Akses Ditolak", "Anda tidak memiliki wewenang untuk mengakses halaman ini.");

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
          setAuthError("Terjadi kesalahan saat memvalidasi otorisasi.");
          toast.error("Error Sistem", "Terjadi kesalahan saat memvalidasi otorisasi.");
          router.push("/auth/login");
        }
      } finally {
        // Selalu hentikan overlay setelah verifikasi selesai (sukses/gagal),
        // agar tidak menggantung di layar.
        stopLoading();
      }
    };

    validateRole();

    return () => {
      isMounted = false;
      stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesKey, pathname]);

  return (
    <>
      {children}
      {!isAuthorized && authError && null}
    </>
  );
}
