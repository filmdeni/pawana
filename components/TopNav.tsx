"use client";
import Link from "next/link";
import { Search, Bell, Plus, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { logoutAction } from "@/lib/actions/auth";

interface TopNavProps {
  coins?: number;
  username?: string;
  avatarUrl?: string | null;
  rank?: string;
  xp?: number;
  xpMax?: number;
}

export default function TopNav({
  coins = 12450,
  username = "MysticPredictor",
  avatarUrl = null,
  rank = "#24",
  xp = 2450,
  xpMax = 5000,
}: TopNavProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-56 right-0 h-14 glass border-b border-[rgba(124,58,237,0.2)] z-30 flex items-center px-5 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาหัวข้อทำนาย..."
          className="w-full bg-white/5 border border-[rgba(124,58,237,0.2)] rounded-lg pl-9 pr-4 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Coins */}
        <div id="wallet-coin-target" className="glass-gold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200">
          <Image src="/images/point2.png" alt="point" width={16} height={16} />
          <span className="text-sm font-bold text-yellow-400 glow-text-gold">
            {coins.toLocaleString()}
          </span>
          <button className="ml-1 w-5 h-5 rounded-full bg-yellow-400/20 hover:bg-yellow-400/30 flex items-center justify-center transition-colors">
            <Plus className="w-3 h-3 text-yellow-400" />
          </button>
        </div>

        {/* Create Prediction */}
        <Link
          href="/create"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white transition-all glow-purple"
        >
          <Plus className="w-4 h-4" />
          สร้างคำทำนาย
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
          <Bell className="w-4 h-4 text-purple-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Link>

        {/* Profile + Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 border-2 border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-200 overflow-hidden">
                {avatarUrl
                  ? <Image src={avatarUrl} alt={username} width={32} height={32} className="w-full h-full object-cover" />
                  : username[0]?.toUpperCase()}
              </div>
              <div className="absolute -inset-0.5 rounded-full border border-purple-500/30 aura-ring" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-none">{username}</p>
              <p className="text-[10px] text-purple-400 mt-0.5">นักพยากรณ์ {rank}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl border border-[rgba(124,58,237,0.3)] overflow-hidden shadow-xl z-50">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4 text-purple-400" />
                โปรไฟล์
              </Link>
              <div className="border-t border-[rgba(124,58,237,0.15)]" />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
