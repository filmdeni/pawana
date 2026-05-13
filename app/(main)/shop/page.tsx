"use client";
import { useState } from "react";
import { ShoppingBag, Coins, Sparkles } from "lucide-react";
import ParallaxBg from "@/components/ParallaxBg";

const categories = ["แนะนำ", "ไอเท็ม", "กรอบโปรไฟล์", "ฉาย", "เอฟเฟกต์"];

const items = [
  { id: 1, name: "ซุพพีเชส จักรวาล",         type: "บูสต์", desc: "เพิ่มความน่าจะเป็น +10% เป็นเวลา 7 วัน", price: 2000, rarity: "epic",      emoji: "🔮", featured: true },
  { id: 2, name: "พิมคำทำนายอนาคต",            type: "ไอเท็ม",desc: "เพิ่มคำเตือนสำหรับการทำนาย",           price: 1500, rarity: "rare",      emoji: "📜" },
  { id: 3, name: "เหรียญนำโชค",                type: "บูสต์", desc: "รับญาณเพิ่ม +20% เป็นเวลา 3 วัน",     price: 1000, rarity: "uncommon",  emoji: "🪙" },
  { id: 4, name: "กล่องสุ่มไอเท็ม",           type: "กล่อง", desc: "สุ่มรับไอเท็มสุดหายาก",                price: 2500, rarity: "legendary", emoji: "📦" },
  { id: 5, name: "กรอบโปรไฟล์ Cosmic",        type: "กรอบ",  desc: "กรอบโปรไฟล์สไตล์จักรวาลหายาก",        price: 1200, rarity: "rare",      emoji: "🌌" },
  { id: 6, name: "กรอบ Gold Crown",            type: "กรอบ",  desc: "แสดงถึงสถานะสูงสุด",                   price: 1500, rarity: "epic",      emoji: "👑" },
  { id: 7, name: "กรอบ Neon Violet",           type: "กรอบ",  desc: "เนียนไม่มีที่ติ",                      price: 1800, rarity: "rare",      emoji: "💜" },
  { id: 8, name: "กรอบ Dark Matter",           type: "กรอบ",  desc: "สีดำลึกลับสุดๆ",                       price: 2000, rarity: "epic",      emoji: "⚫" },
];

const rarityConfig: Record<string, { label: string; color: string; bg: string; border: string; shadow: string; holo?: boolean }> = {
  uncommon:  { label: "Uncommon",  color: "#5ED3A6", bg: "rgba(94,211,166,0.08)",  border: "rgba(94,211,166,0.25)",  shadow: "rgba(94,211,166,0.15)"  },
  rare:      { label: "Rare",      color: "#88eeff", bg: "rgba(136,238,255,0.08)", border: "rgba(136,238,255,0.30)", shadow: "rgba(136,238,255,0.20)" },
  epic:      { label: "Epic",      color: "#d480ff", bg: "rgba(212,128,255,0.10)", border: "rgba(212,128,255,0.35)", shadow: "rgba(212,128,255,0.25)" },
  legendary: { label: "Legendary", color: "#D7B56D", bg: "rgba(215,181,109,0.12)", border: "rgba(215,181,109,0.40)", shadow: "rgba(215,181,109,0.35)", holo: true },
};

export default function ShopPage() {
  const [cat, setCat]       = useState("แนะนำ");
  const [buying, setBuying] = useState<number | null>(null);

  return (
    <div className="relative">
      <ParallaxBg variant="pink" />
    <div className="relative p-4 md:p-6 max-w-screen-xl mx-auto" style={{ zIndex: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2 gradient-gold">
            <ShoppingBag className="w-5 h-5 text-[#D7B56D]" /> ร้านค้า
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">ใช้ญาณฯ เพื่อซื้อไอเท็มพิเศษ</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "rgba(215,181,109,0.08)", border: "1px solid rgba(215,181,109,0.22)" }}
        >
          <Coins className="w-4 h-4 text-[#D7B56D]" />
          <span className="font-black text-[#D7B56D] glow-text-gold">12,450</span>
          <span className="text-xs text-[var(--text-muted)]">ญาณฯ</span>
        </div>
      </div>

      {/* Featured */}
      <div
        className="rounded-2xl p-5 mb-6 relative overflow-hidden scanlines"
        style={{
          background: "linear-gradient(135deg, #1A1035 0%, #0E0B1D 60%)",
          border: "1px solid rgba(212,128,255,0.35)",
          boxShadow: "0 0 40px rgba(212,128,255,0.10)",
        }}
      >
        <div className="absolute inset-0 cosmic-bg opacity-80 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full float pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,128,255,0.15) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="text-5xl sm:text-7xl float select-none">🔮</div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black"
                style={{ background: "rgba(215,181,109,0.15)", border: "1px solid rgba(215,181,109,0.35)", color: "#D7B56D" }}
              >
                ⭐ แนะนำพิเศษ
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(212,128,255,0.15)", border: "1px solid rgba(212,128,255,0.35)", color: "#d480ff" }}
              >
                Epic
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">ซุพพีเชส จักรวาลแห่งการทำนาย</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(163,149,191,0.90)" }}>
              เพิ่มความแม่นยำ +10% เป็นเวลา 7 วัน · สิทธิ์พิเศษสำหรับสมาชิกระดับสูง
            </p>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #C89B4F, #D7B56D)",
                color: "#0E0B1D",
                boxShadow: "0 0 24px rgba(215,181,109,0.35)",
              }}
            >
              <Coins className="w-4 h-4" /> ซื้อ 2,000 ญาณฯ
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "active" : ""}`}>{c}</button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const r = rarityConfig[item.rarity];
          const isBuying = buying === item.id;
          return (
            <div
              key={item.id}
              className="glass card-hover rounded-2xl overflow-hidden group cursor-pointer relative"
              style={{ border: `1px solid ${r.border}` }}
            >
              {/* Holographic shimmer overlay for legendary */}
              {r.holo && (
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{ background: "linear-gradient(135deg, #d480ff, #88eeff, #D7B56D, #d480ff)", backgroundSize: "300%", animation: "holo 4s ease infinite" }} />
              )}

              {/* Item image area */}
              <div
                className="relative h-32 flex items-center justify-center overflow-hidden"
                style={{ background: `radial-gradient(circle at 50% 50%, ${r.bg} 0%, rgba(14,11,29,0.6) 80%)` }}
              >
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300 select-none">
                  {item.emoji}
                </span>
                {/* Top shine */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/[0.04] to-transparent" />
                {/* Rarity badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                    style={{ color: r.color, background: r.bg, border: `1px solid ${r.border}`, boxShadow: `0 0 8px ${r.shadow}` }}
                  >
                    {item.rarity === "legendary" && <Sparkles className="w-2.5 h-2.5" />}
                    {r.label}
                  </span>
                </div>
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#10101e] to-transparent" />
              </div>

              {/* Info */}
              <div className="p-3.5">
                <p className="text-xs font-black text-[var(--text-primary)] line-clamp-1 mb-0.5">{item.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">{item.desc}</p>
                <button
                  onClick={() => setBuying(isBuying ? null : item.id)}
                  className="w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: isBuying ? r.bg : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isBuying ? r.border : "#2A1F45"}`,
                    color: isBuying ? r.color : "var(--text-secondary)",
                    boxShadow: isBuying ? `0 0 12px ${r.shadow}` : undefined,
                  }}
                >
                  <Coins className="w-3 h-3" /> {item.price.toLocaleString()} ญาณฯ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
