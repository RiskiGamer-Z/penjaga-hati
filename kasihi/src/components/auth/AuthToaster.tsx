"use client";

import { useEffect } from "react";
import { toast } from "@/utils/toast";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function AuthToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      toast.error(error, {
        id: "auth-error", // Prevent duplicate toasts
        duration: 4000,
        position: "top-center",
        style: {
          background: "#FEF2F2",
          borderColor: "#FEE2E2",
          color: "#EF4444",
        },
      });
    }

    if (success) {
      toast.success(success, {
        id: "auth-success", // Prevent duplicate toasts
        duration: 4000,
        position: "top-center",
        style: {
          background: "#F0FDF4",
          borderColor: "#DCFCE7",
          color: "#22C55E",
        },
      });
    }

    // Clear search params from URL so refresh doesn't trigger toast again
    if (error || success) {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
