"use client";

import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["user"]}>
      {children}
    </RoleGuard>
  );
}
