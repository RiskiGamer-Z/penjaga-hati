"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
}

export default function SubmitButton({ label, loadingLabel = "Memproses...", className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={className || "flex mt-3 items-center justify-center w-full rounded-xl py-4 px-6 bg-brand-evergreen hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"}
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span className="font-semibold text-white text-base">{loadingLabel}</span>
        </div>
      ) : (
        <span className="font-semibold text-white text-base">
          {label}
        </span>
      )}
    </button>
  );
}
