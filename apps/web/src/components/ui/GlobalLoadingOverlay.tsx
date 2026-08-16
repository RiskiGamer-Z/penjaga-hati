"use client";

import { Loader2 } from "lucide-react";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Memproses...");

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg || "Memproses...");
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, message, startLoading, stopLoading }}>
      {children}
      <GlobalLoadingOverlay />
    </LoadingContext.Provider>
  );
}

interface GlobalLoadingOverlayProps {
  overrideMessage?: string;
}

export default function GlobalLoadingOverlay({ overrideMessage }: GlobalLoadingOverlayProps) {
  const context = useContext(LoadingContext);
  
  if (!context) return null;
  
  const { isLoading, message: ctxMessage } = context;
  const displayMessage = overrideMessage || ctxMessage;

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl border border-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-700 tracking-wide">{displayMessage}</p>
      </div>
    </div>
  );
}
