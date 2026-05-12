"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, TrendingUp, MessageSquare, User, Plus,
  MoreHorizontal, Trophy, Zap, ShoppingBag, Bell, Settings, X,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { href: "/",        icon: Home,          label: "หน้าหลัก" },
  { href: "/predict", icon: TrendingUp,    label: "ทำนาย" },
  { href: "/board",   icon: MessageSquare, label: "กระดาน" },
  { href: "/profile", icon: User,          label: "โปรไฟล์" },
];

const moreNav = [
  { href: "/ranking",       icon: Trophy,       label: "อันดับ",          accent: "#D7B56D" },
  { href: "/missions",      icon: Zap,          label: "ภารกิจ",           accent: "#FFB86B", badge: 3 },
  { href: "/shop",          icon: ShoppingBag,  label: "ร้านค้า",          accent: "#d480ff" },
  { href: "/notifications", icon: Bell,         label: "การแจ้งเตือน",    accent: "#88eeff", badge: 5 },
  { href: "/settings",      icon: Settings,     label: "การตั้งค่า",       accent: "#a0aec0" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const moreActive = moreNav.some((n) => pathname === n.href);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="absolute inset-0 glass border-t border-[rgba(124,58,237,0.25)]" />

        <div className="relative z-10 flex items-center px-2 py-2 safe-area-bottom">
          {mainNav.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all
                  ${active ? "text-purple-300" : "text-[var(--text-muted)]"}`}>
                <div className={`relative ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : ""}`}>
                  <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                  {active && <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-sm" />}
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

          {mainNav.slice(2).map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all
                  ${active ? "text-purple-300" : "text-[var(--text-muted)]"}`}>
                <div className={`relative ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : ""}`}>
                  <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                  {active && <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-sm" />}
                </div>
                <span className="text-[9px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all
              ${moreActive ? "text-purple-300" : "text-[var(--text-muted)]"}`}>
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              {moreNav.some((n) => n.badge) && !moreActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="text-[9px] font-semibold leading-none">เพิ่มเติม</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden glass border-t border-[rgba(124,58,237,0.3)] rounded-t-2xl pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(124,58,237,0.15)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">เมนูเพิ่มเติม</span>
              <button onClick={() => setSheetOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {moreNav.map(({ href, icon: Icon, label, accent, badge }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all
                      ${active ? "bg-purple-500/15 border border-purple-500/30" : "hover:bg-white/5"}`}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" style={{ color: active ? accent : undefined, opacity: active ? 1 : 0.6 }} />
                      {badge && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">{badge}</span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-center leading-tight text-[var(--text-muted)]">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
