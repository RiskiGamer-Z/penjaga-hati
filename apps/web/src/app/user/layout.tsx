"use client";

import { ReactNode } from "react";

/**
 * Proteksi akses ditangani sepenuhnya oleh middleware (server-side) di
 * src/middleware.ts, sehingga tidak perlu lagi verifikasi client-side.
 */
export default function UserLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
