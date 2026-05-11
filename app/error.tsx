"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center px-4">
      <div className="glass-gold rounded-2xl p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-xl font-black text-[var(--text-primary)] mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-sm text-[var(--text-muted)] mb-1 leading-relaxed">
            บางอย่างผิดพลาด กรุณาลองใหม่หรือกลับหน้าหลัก
          </p>
          {error.digest && (
            <p className="text-[11px] text-purple-600 mb-5 font-mono">ref: {error.digest}</p>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple"
            >
              <RefreshCw className="w-4 h-4" /> ลองใหม่
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold glass border border-[rgba(124,58,237,0.3)] text-purple-300 hover:bg-white/10 transition-all"
            >
              <Home className="w-4 h-4" /> หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
