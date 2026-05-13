"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Home, TrendingUp, MessageSquare, Trophy, User,
  ShoppingBag, Zap, Bell, Settings, LogOut, Loader2,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

const nav = [
  { href: "/",         label: "หน้าหลัก",    icon: Home,          accent: "#6F4BFF" },
  { href: "/predict",  label: "ทำนาย",        icon: TrendingUp,    accent: "#88eeff" },
  { href: "/board",    label: "กระดานสนทนา", icon: MessageSquare, accent: "#5ED3A6" },
  { href: "/ranking",  label: "อันดับ",        icon: Trophy,        accent: "#D7B56D" },
  { href: "/missions", label: "ภารกิจ",        icon: Zap,           accent: "#FFB86B", badge: 3 },
  { href: "/shop",     label: "ร้านค้า",       icon: ShoppingBag,   accent: "#d480ff" },
  { href: "/profile",  label: "โปรไฟล์",      icon: User,          accent: "#7B61FF" },
];


export default function Sidebar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => { logoutAction(); });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col glass border-r border-[rgba(124,58,237,0.2)] z-40">
      {/* Logo */}
      <div className="px-3 pt-4 pb-3 border-b border-[rgba(124,58,237,0.15)]">
        <Link href="/" className="flex flex-col items-center gap-1">
          <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/5" }}>
            <Image src="/images/logo.png" alt="logo" fill sizes="200px" className="object-contain" />
          </div>
          <p className="text-[11px] text-white">ทำนายอนาคต, สร้างตำนาน</p>
        </Link>
      </div>

      {/* Nav + Promo Card — flex-1 with card centered */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        <nav className="px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon, accent, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${active ? "nav-active" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"}`}
                style={active ? { borderLeftColor: accent } : undefined}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0 transition-colors"
                  style={{ color: active ? accent : undefined }}
                />
                <span className="flex-1">{label}</span>
                {badge && !active && (
                  <span className="notif-badge">{badge}</span>
                )}
              </Link>
            );
          })}

        </nav>

        {/* Promo Card — centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-3 py-3">
        <Link href="/predict"
          className="block rounded-2xl overflow-hidden border border-[#2A1F45] hover:border-[#35295A] transition-all group"
          style={{ background: "#14111F" }}>
          {/* Image */}
          <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
            <Image
              src="/images/เช็คคำทำนาย2.jpg"
              alt="เช็คคำทำนาย"
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
          </div>
          {/* Text + button — bottom section */}
          <div className="px-3.5 pt-2.5 pb-3.5 flex flex-col gap-2.5">
            <div className="text-center">
              <p className="text-xs font-semibold text-[#A59BBF]">สายตาจักรวาล</p>
              <p className="text-[11px] text-[#756D8F] mt-0.5">กำลังจับตามองคุณอยู่</p>
            </div>
            <div
              className="w-full py-2 rounded-xl text-center text-xs font-bold text-[#14111F] transition-all group-hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #C89B4F, #D7B56D)" }}>
              เช็คคำทำนาย
            </div>
          </div>
        </Link>
        </div>
      </div>

      {/* Bottom Utilities */}
      <div className="px-3 py-3 flex items-center justify-around" style={{ borderTop: "1px solid #1E1535" }}>
        <Link href="/settings" className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] transition-all">
          <Settings className="w-5 h-5" />
        </Link>
        <Link href="/notifications" className="relative p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] transition-all">
          <Bell className="w-5 h-5" />
          <span className="notif-badge absolute -top-0.5 -right-0.5">5</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="p-2 rounded-xl text-[#D96B6B]/60 hover:text-[#D96B6B] hover:bg-[#D96B6B]/[0.06] transition-all disabled:opacity-40"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
