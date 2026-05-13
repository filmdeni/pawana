"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Share2, Flag } from "lucide-react";
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
  imagePosition?: string;
  totalPool?: string;
  commentCount?: number;
  options?: { label: string; percent: number }[];
  userVote?: { choiceLabel: string; amount: number } | null;
}

// ── Category config ───────────────────────────────────────────────
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

const BAR_COLORS = ["#4ade80", "#60a5fa", "#fb923c", "#c084fc", "#f472b6", "#34d399"];

// ── Option row ────────────────────────────────────────────────────
function OptionRow({ label, percent, index }: { label: string; percent: number; index: number }) {
  const isYes = label === "ใช่";
  const isNo  = label === "ไม่ใช่";
  const color = isYes ? "#5ED3A6" : isNo ? "#D96B6B" : BAR_COLORS[index % BAR_COLORS.length];
  return (
    <div className="flex items-center gap-2.5 py-[5px]">
      <span className="text-[12px] text-[var(--text-muted)] flex-1 min-w-0 truncate">{label}</span>
      <div className="relative h-[5px] w-20 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${percent}%`, background: color, transition: "width 0.6s ease" }}
        />
      </div>
      <span className="text-[13px] font-bold text-[var(--text-primary)] w-8 text-right flex-shrink-0">{percent}%</span>
    </div>
  );
}

// ── Donut gauge (SVG) ─────────────────────────────────────────────
function DonutGauge({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={9} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
    </svg>
  );
}

// ── Finance gauge card (keeps h-36 image) ────────────────────────
function VotedBadge({ choiceLabel, amount }: { choiceLabel: string; amount: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{
        background: "rgba(111,75,255,0.15)",
        border: "1px solid rgba(111,75,255,0.35)",
        color: "#C4B5FD",
      }}
    >
      <span style={{ color: "#A78BFA" }}>✓</span>
      ทำนายแล้ว · {choiceLabel} · {amount.toLocaleString()} ญาณ
    </div>
  );
}

function FinanceCard({ p }: { p: Prediction }) {
  const router = useRouter();
  const cat = catConfig["การเงิน"];
  const { yes: yesW } = clampPct(p.yesPercent);
  const totalPool = p.totalPool ?? p.yesPool;
  const gaugeColor = "#fbbf24";

  return (
    <Link href={`/predict/${p.id}`}>
      <article className="glass card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full">

        {/* ── Thumbnail h-36 เหมือนเดิม ── */}
        <div className={`relative h-36 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)`, opacity: p.hot || p.trending ? 1 : 0.4 }} />

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            <span className="text-5xl select-none opacity-50 group-hover:opacity-70 transition-opacity">{p.image ?? "₿"}</span>
          )}

          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: cat.pill }}>
            {p.category}
          </span>

          {p.hot ? (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
              <span className="card-live-dot" /> LIVE
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-orange-300">
              <Flame className="w-3 h-3 text-orange-400" />
              {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-3.5 pt-3 pb-3 flex flex-col gap-3 flex-1">
          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-yellow-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Gauge + ใช่/ไม่ */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <DonutGauge percent={yesW} color={gaugeColor} size={80} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[15px] font-black text-white leading-none">{yesW}%</span>
                <span className="text-[9px] text-[var(--text-muted)] mt-0.5">โอกาส</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <button
                onClick={(e) => { e.preventDefault(); router.push(`/predict/${p.id}?vote=yes`); }}
                className="w-full py-2 rounded-xl text-sm font-bold text-center transition-all hover:brightness-110 active:scale-95"
                style={{ background: "rgba(94,211,166,0.15)", border: "1px solid rgba(94,211,166,0.4)", color: "#5ED3A6" }}>
                ใช่
              </button>
              <button
                onClick={(e) => { e.preventDefault(); router.push(`/predict/${p.id}?vote=no`); }}
                className="w-full py-2 rounded-xl text-sm font-bold text-center transition-all hover:brightness-110 active:scale-95"
                style={{ background: "rgba(217,107,107,0.15)", border: "1px solid rgba(217,107,107,0.4)", color: "#D96B6B" }}>
                ไม่
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <span className={p.timeLeft.includes("ชั่วโมง") ? "text-red-400 font-medium" : "font-medium"}>
              • {p.timeLeft}
            </span>
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
              {totalPool}
            </span>
            <span className="flex items-center gap-1">
              👥 {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={(e) => e.preventDefault()} className="p-1 rounded hover:bg-white/10 transition-colors">
                <Share2 className="w-3 h-3" />
              </button>
              <button onClick={(e) => e.preventDefault()} className="p-1 rounded hover:bg-white/10 transition-colors">
                <Flag className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </article>
    </Link>
  );
}

// ── Card ──────────────────────────────────────────────────────────
export default function PredictionCard({ p }: { p: Prediction; showComments?: boolean }) {
  if (p.category === "การเงิน") return <FinanceCard p={p} />;

  const cat = catConfig[p.category] ?? DEFAULT_CAT;
  const { yes: yesW, no: noW } = clampPct(p.yesPercent);

  const options: { label: string; percent: number }[] = p.options ?? [
    { label: "ใช่", percent: yesW },
    { label: "ไม่ใช่", percent: noW },
  ];

  const totalPool = p.totalPool ?? p.yesPool;

  return (
    <Link href={`/predict/${p.id}`}>
      <article className="glass card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full">

        {/* ── Thumbnail (same size as before h-36) ── */}
        <div className={`relative h-36 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)`, opacity: p.hot || p.trending ? 1 : 0.4 }} />

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            <span className="text-5xl select-none opacity-50 group-hover:opacity-70 transition-opacity">{p.image ?? "🔮"}</span>
          )}

          {/* Category pill */}
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: cat.pill }}>
            {p.category}
          </span>

          {/* HOT / trending badge */}
          {p.hot ? (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
              <span className="card-live-dot" /> LIVE
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-orange-300">
              <Flame className="w-3 h-3 text-orange-400" />
              {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants}
            </span>
          )}

          {p.hot && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 100%, ${cat.glow} 0%, transparent 65%)` }} />
          )}

          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-3.5 pt-3 pb-3 flex flex-col gap-2 flex-1">

          {/* Title */}
          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-purple-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Options list */}
          <div className="flex flex-col divide-y divide-white/[0.04] mt-0.5">
            {options.map((opt, i) => (
              <OptionRow key={opt.label} label={opt.label} percent={opt.percent} index={i} />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <span className={p.timeLeft.includes("ชั่วโมง") ? "text-red-400 font-medium" : "font-medium"}>
              • {p.timeLeft}
            </span>
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
              {totalPool}
            </span>
            <span className="flex items-center gap-1">
              👥 {p.participants >= 1000 ? `${(p.participants / 1000).toFixed(1)}K` : p.participants}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={(e) => e.preventDefault()} className="p-1 rounded hover:bg-white/10 transition-colors">
                <Share2 className="w-3 h-3" />
              </button>
              <button onClick={(e) => e.preventDefault()} className="p-1 rounded hover:bg-white/10 transition-colors">
                <Flag className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </article>
    </Link>
  );
}
