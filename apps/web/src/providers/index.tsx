"use client";

import { LoadingProvider } from "@/components/ui/GlobalLoadingOverlay";

export function WebProviders({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}