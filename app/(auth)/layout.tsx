import Link from "next/link";
import { Star } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen cosmic-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cosmic bg particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #4c1d95, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center glow-purple">
            <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
          </div>
          <div className="absolute -inset-1.5 rounded-2xl bg-purple-500/20 blur aura-ring" />
        </div>
        <div>
          <span className="text-2xl font-black gradient-gold glow-text-gold">ภาวนา</span>
          <p className="text-xs text-purple-400">ทำนายอนาคต · สร้างตำนาน</p>
        </div>
      </Link>

      {children}

      <p className="mt-6 text-xs text-[var(--text-muted)] text-center">
        © 2024 ภาวนา · แพลตฟอร์มทำนายสังคม · ไม่ใช่การพนัน
      </p>
    </div>
  );
}
