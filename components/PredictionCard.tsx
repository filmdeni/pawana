"use client";
import Link from "next/link";
import { Flame } from "lucide-react";
import { clampPct } from "@/lib/poolDisplay";

export interface Prediction {
  id: string;
  title: string;
  category: string;
  yesPercent: number;
  noPercent: number;
  yesPool: string;
  noPool: string;
  participants: number;
  timeLeft: string;
  trending?: boolean;
  hot?: boolean;
  image?: string;
  imageUrl?: string;
  totalPool?: string;
}

const catConfig: Record<string, { bg: string; pill: string; accent: string; glow: string }> = {
  ดราม่า:  { bg: "from-rose-950   via-pink-900    to-rose-950",   pill: "rgba(244,63,94,0.85)",   accent: "#f43f5e", glow: "rgba(244,63,94,0.25)"   },
  เกม:     { bg: "from-indigo-950 via-violet-900  to-indigo-950", pill: "rgba(99,102,241,0.85)",  accent: "#818cf8", glow: "rgba(99,102,241,0.25)"  },
  กีฬา:   { bg: "from-green-950  via-emerald-900 to-green-950",  pill: "rgba(22,163,74,0.85)",   accent: "#4ade80", glow: "rgba(22,163,74,0.25)"   },
  ฟุตบอล: { bg: "from-green-950  via-emerald-900 to-green-950",  pill: "rgba(22,163,74,0.85)",   accent: "#4ade80", glow: "rgba(22,163,74,0.25)"   },
  การเงิน: { bg: "from-yellow-950 via-amber-900   to-yellow-950", pill: "rgba(202,138,4,0.85)",   accent: "#fbbf24", glow: "rgba(202,138,4,0.30)"   },
  ไวรัล:  { bg: "from-orange-950 via-red-900     to-orange-950", pill: "rgba(234,88,12,0.85)",   accent: "#fb923c", glow: "rgba(234,88,12,0.25)"   },
  อื่นๆ:   { bg: "from-purple-950 via-violet-900  to-purple-950", pill: "rgba(111,75,255,0.85)",  accent: "#a78bfa", glow: "rgba(111,75,255,0.20)"  },
};

const DEFAULT_CAT = catConfig["อื่นๆ"];

export default function PredictionCard({ p }: { p: Prediction }) {
  const cat = catConfig[p.category] ?? DEFAULT_CAT;
  const { yes: yesW, no: noW } = clampPct(p.yesPercent);

  return (
    <Link href={`/predict/${p.id}`}>
      <article className="glass card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full">
        {/* Thumbnail */}
        <div className={`relative h-36 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden`}>
          {/* Trending top border */}
          {p.trending && (
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)` }} />
          )}
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover opacity-80" />
          ) : (
            <span className="text-6xl select-none opacity-60">{p.image ?? "🔮"}</span>
          )}
          {/* Category chip */}
          <span
            className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: cat.pill }}
          >
            {p.category}
          </span>
          {/* Pool amount */}
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-orange-300">
            <Flame className="w-3 h-3 text-orange-400" />
            {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* Body */}
        <div className="p-3.5 flex flex-col gap-2.5 flex-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {p.title}
          </h3>

          {/* Progress bar */}
          <div>
            <div className="flex rounded-full overflow-hidden h-1.5 mb-1" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="progress-yes transition-all duration-700" style={{ width: `${yesW}%` }} />
              <div className="progress-no transition-all duration-700"  style={{ width: `${noW}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-[#5ED3A6]">ใช่ {yesW}%</span>
              <span className="text-[#D96B6B]">ไม่ใช่ {noW}%</span>
            </div>
          </div>

          {/* YES / NO buttons */}
          <div className="grid grid-cols-2 gap-1.5 mt-auto">
            <button onClick={(e) => e.preventDefault()} className="btn-yes rounded-xl py-2 text-xs font-bold">
              ✓ ใช่
            </button>
            <button onClick={(e) => e.preventDefault()} className="btn-no rounded-xl py-2 text-xs font-bold">
              ✗ ไม่ใช่
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>🔥 {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants} คน</span>
            <span className={p.timeLeft.includes("ชั่วโมง") && parseInt(p.timeLeft) < 2 ? "timer-critical" : ""}>
              ⏱ {p.timeLeft}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
