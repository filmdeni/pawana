"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MessageSquare, Trophy, User, Plus } from "lucide-react";

const nav = [
  { href: "/", icon: Home, label: "หน้าหลัก" },
  { href: "/predict", icon: TrendingUp, label: "ทำนาย" },
  { href: "/board", icon: MessageSquare, label: "กระดาน" },
  { href: "/ranking", icon: Trophy, label: "อันดับ" },
  { href: "/profile", icon: User, label: "โปรไฟล์" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 glass border-t border-[rgba(124,58,237,0.25)]" />

      <div className="relative z-10 flex items-center px-2 py-2 safe-area-bottom">
        {nav.slice(0, 2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all
                ${active ? "text-purple-300" : "text-[var(--text-muted)]"}`}>
              <div className={`relative ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : ""}`}>
                <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                {active && (
                  <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-sm" />
                )}
              </div>
              <span className="text-[9px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}

        {/* Center Create button */}
        <div className="flex-1 flex justify-center">
          <Link href="/create"
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center glow-purple shadow-lg -mt-4 border-2 border-[var(--bg-base)] hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {nav.slice(2).map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all
                ${active ? "text-purple-300" : "text-[var(--text-muted)]"}`}>
              <div className={`relative ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : ""}`}>
                <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                {active && (
                  <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-sm" />
                )}
              </div>
              <span className="text-[9px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
