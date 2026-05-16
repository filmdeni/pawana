"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Share2, Flag, Zap, Crown, Timer } from "lucide-react";
import { clampPct } from "@/lib/poolDisplay";
import { useRealtimeVotes } from "@/lib/hooks/useRealtimeVotes";
import { useCallback, useEffect, useRef, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";

export interface Prediction {
  id: string;
  title: string;
  category: string;
  yesPercent: number;
  noPercent: number;
  yesPool: string;
  noPool: string;
  yesPoolRaw?: number;
  noPoolRaw?: number;
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
  /** quick = ≤15m · standard = 1h–24h · epic = 3d–1mo */
  predictionType?: "quick" | "standard" | "epic";
  /** ISO string for live countdown clock */
  endsAt?: string;
  /** Coin symbol e.g. "BTC" "ETH" — triggers CryptoCard */
  coinSymbol?: string;
  subcategory?: string | null;
  /** true = YES wins · false = NO wins · null = not resolved yet */
  resolution?: boolean | null;
  resolvedAt?: string | null;
  yesLabel?: string;
  noLabel?: string;
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

// ── Card State System ─────────────────────────────────────────
type CardState = "normal" | "live" | "hot" | "ending-soon" | "final-minutes";

function getCardState(p: Prediction): CardState {
  const msLeft = p.endsAt ? new Date(p.endsAt).getTime() - Date.now() : Infinity;
  if (msLeft > 0 && msLeft <= 15 * 60_000) return "final-minutes";
  if (msLeft > 0 && msLeft <= 24 * 3_600_000) return "ending-soon";
  if (p.hot) return "live";
  if (p.trending) return "hot";
  return "normal";
}

const STATE_BORDER: Record<CardState, string> = {
  normal:           "1px solid rgba(255,255,255,0.07)",
  live:             "1px solid rgba(239,68,68,0.42)",
  hot:              "1px solid rgba(234,88,12,0.32)",
  "ending-soon":    "1px solid rgba(251,191,36,0.32)",
  "final-minutes":  "1px solid rgba(239,68,68,0.56)",
};

const STATE_ANIM: Record<CardState, string> = {
  normal:           "glass card-hover",
  live:             "card-state-live card-hover",
  hot:              "card-state-hot card-hover",
  "ending-soon":    "card-state-ending card-hover",
  "final-minutes":  "card-state-urgent card-hover",
};

const STATE_BG_TINT: Record<CardState, string | undefined> = {
  normal:           undefined,
  live:             "rgba(239,68,68,0.02)",
  hot:              undefined,
  "ending-soon":    undefined,
  "final-minutes":  "rgba(239,68,68,0.03)",
};

// ── StateTopBar — colored stripe at top of card ───────────────
function StateTopBar({ state }: { state: CardState }) {
  const cls: Record<CardState, string> = {
    normal:           "",
    live:             "card-topbar-live",
    hot:              "card-topbar-hot",
    "ending-soon":    "card-topbar-ending",
    "final-minutes":  "card-topbar-urgent",
  };
  if (state === "normal") return (
    <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />
  );
  return (
    <div className={`h-[2px] w-full flex-shrink-0 ${cls[state]}`} />
  );
}

// ── StateBadge — top-right overlay on the image ───────────────
function StateBadge({ state, p, participantCount }: { state: CardState; p: Prediction; participantCount: number }) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  if (state === "final-minutes") return (
    <span
      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm urgent-badge-flash"
      style={{ background: "rgba(220,38,38,0.35)", border: "1px solid rgba(239,68,68,0.7)", color: "#fca5a5" }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"
        style={{ boxShadow: "0 0 6px #f87171" }} />
      <span className="text-[11px] font-black tracking-wide">HURRY</span>
    </span>
  );

  if (state === "ending-soon") return <EndingSoonBadge endsAt={p.endsAt} fallback={p.timeLeft} />;

  if (state === "live") return (
    <span
      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm"
      style={{ background: "rgba(220,38,38,0.25)", border: "1px solid rgba(239,68,68,0.60)", color: "#f87171" }}
    >
      <span className="card-live-dot" />
      <span className="text-[11px] font-black tracking-widest">LIVE</span>
    </span>
  );

  if (state === "hot") return (
    <span
      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm hot-badge-glow"
      style={{ background: "rgba(234,88,12,0.20)", border: "1px solid rgba(234,88,12,0.50)", color: "#fb923c" }}
    >
      <span className="fire-flicker text-[10px]">🔥</span>
      <span className="text-[11px] font-black">{fmt(participantCount)}</span>
    </span>
  );

  // normal
  return (
    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-orange-300">
      <Flame className="w-3 h-3 text-orange-400" />
      {fmt(participantCount)}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  TIMER SYSTEM — urgency-aware countdown
//  Tiers: calm(>7d) · watch(1d–7d) · hour(1h–24h) · minute(15m–1h) · critical(<15m)
// ══════════════════════════════════════════════════════════════

type TimerTier = "calm" | "watch" | "hour" | "minute" | "critical" | "expired";

interface CountdownResult {
  msLeft: number;
  tier: TimerTier;
  label: string;   // human-readable: "25d" / "18h 32m" / "47m" / "04:23"
  mm: string;      // zero-padded minutes (critical only)
  ss: string;      // zero-padded seconds (critical only)
}

function getTier(ms: number): TimerTier {
  if (ms <= 0)                  return "expired";
  if (ms < 15 * 60_000)        return "critical";
  if (ms < 60 * 60_000)        return "minute";
  if (ms < 24 * 3_600_000)     return "hour";
  if (ms < 7 * 86_400_000)     return "watch";
  return "calm";
}

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

function buildLabel(ms: number, tier: TimerTier): string {
  if (tier === "expired")  return "หมดเวลา";
  if (tier === "critical") {
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return `${pad(m)}:${pad(s)}`;
  }
  if (tier === "minute") return `${Math.floor(ms / 60_000)}m`;
  if (tier === "hour") {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (tier === "watch") {
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  return `${Math.floor(ms / 86_400_000)}d`;
}

function useCountdown(endsAt?: string): CountdownResult {
  const getMs = useCallback(
    () => endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : Infinity,
    [endsAt]
  );
  const [msLeft, setMsLeft] = useState(getMs);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setMsLeft(getMs());
    const tier = getTier(getMs());
    if (tier === "expired" || tier === "calm") return;
    // critical: every second · minute: every 30s · hour/watch: every minute
    const interval = tier === "critical" ? 1000 : tier === "minute" ? 30_000 : 60_000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [endsAt, getMs]);

  const tier  = getTier(msLeft);
  const label = buildLabel(msLeft, tier);
  const mRaw  = Math.floor(msLeft / 60_000);
  const sRaw  = Math.floor((msLeft % 60_000) / 1_000);

  return { msLeft, tier, label, mm: pad(mRaw), ss: pad(sRaw) };
}

// ── useResolution — realtime subscription for prediction result ───
function useResolution(predictionId: string, initial: boolean | null | undefined) {
  const [resolution, setResolution] = useState<boolean | null>(initial ?? null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (initial != null) setResolution(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`resolution:${predictionId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "predictions",
        filter: `id=eq.${predictionId}`,
      }, (payload) => {
        const r = (payload.new as { resolution?: boolean | null }).resolution;
        if (r != null) setResolution(r);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [predictionId]);

  return { resolution, dismissed, dismiss: () => setDismissed(true) };
}

// ── Tier color map ────────────────────────────────────────────
const TIER_COLOR: Record<TimerTier, string> = {
  calm:     "rgba(255,255,255,0.28)",
  watch:    "rgba(255,255,255,0.50)",
  hour:     "#94a3b8",
  minute:   "#fbbf24",
  critical: "#ef4444",
  expired:  "#5ED3A6",
};
const TIER_GLOW: Record<TimerTier, string | undefined> = {
  calm:     undefined,
  watch:    undefined,
  hour:     undefined,
  minute:   "0 0 8px rgba(251,191,36,0.35)",
  critical: "0 0 12px rgba(239,68,68,0.55)",
  expired:  undefined,
};

// ── LiveTimer — footer badge, replaces CountdownBadge ─────────
function LiveTimer({ endsAt, fallback }: { endsAt?: string; fallback?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { tier, label } = useCountdown(mounted ? endsAt : undefined);
  const color = TIER_COLOR[tier];
  const glow  = TIER_GLOW[tier];

  if (!mounted) {
    const isWarm = fallback?.includes("นาที") || fallback?.includes("วิ");
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: isWarm ? "#fbbf24" : "var(--text-muted)" }}>
        <Timer className="w-3 h-3 opacity-70" />{fallback ?? "—"}
      </span>
    );
  }

  if (!endsAt) {
    const isWarm = fallback?.includes("นาที") || fallback?.includes("วิ");
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: isWarm ? "#fbbf24" : "var(--text-muted)" }}>
        <Timer className="w-3 h-3 opacity-70" />{fallback}
      </span>
    );
  }

  if (tier === "expired") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: "#5ED3A6" }}>
      ✓ หมดเวลา
    </span>
  );

  if (tier === "critical") return (
    <span
      className="inline-flex items-center gap-1 font-black text-[12px] tabular-nums urgent-badge-flash"
      style={{ color, textShadow: glow, letterSpacing: "0.04em" }}
      suppressHydrationWarning
    >
      ⚡ {label}
    </span>
  );

  if (tier === "minute") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color, textShadow: glow }}>
      <Timer className="w-3 h-3" />{label}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color }}>
      <Timer className="w-3 h-3 opacity-50" />{label}
    </span>
  );
}

// ── UrgencyBar — depleting progress bar + large countdown ─────
// Shows for minute(<1h) and critical(<15m) tiers only
function UrgencyBar({ endsAt }: { endsAt?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { msLeft, tier, label, mm, ss } = useCountdown(mounted ? endsAt : undefined);

  if (!mounted || !endsAt || tier === "calm" || tier === "watch" || tier === "hour" || tier === "expired") return null;

  if (tier === "critical") {
    const pct = Math.max(0, Math.min(100, (msLeft / (15 * 60_000)) * 100));
    const barColor = pct > 60
      ? "linear-gradient(90deg,#dc2626,#ef4444)"
      : pct > 25
      ? "linear-gradient(90deg,#b91c1c,#dc2626)"
      : "linear-gradient(90deg,#7f1d1d,#b91c1c)";
    return (
      <div className="rounded-xl overflow-hidden"
        style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.28)" }}>
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
          <span className="text-[10px] font-black tracking-widest urgent-badge-flash"
            style={{ color: "rgba(252,165,165,0.85)" }}>
            ⚡ FINAL MINUTES
          </span>
          <span
            className="font-black tabular-nums"
            style={{ fontSize: "1.15rem", color: "#f87171", textShadow: "0 0 14px rgba(239,68,68,0.65)", letterSpacing: "0.08em" }}
            suppressHydrationWarning
          >
            {mm}:{ss}
          </span>
        </div>
        {/* Depleting bar */}
        <div className="h-[3px] w-full" style={{ background: "rgba(239,68,68,0.14)" }}>
          <div className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: barColor, boxShadow: "0 0 6px rgba(239,68,68,0.5)" }} />
        </div>
      </div>
    );
  }

  // minute tier: 15m–60m
  const pct = Math.max(0, Math.min(100, (msLeft / (60 * 60_000)) * 100));
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
        <span className="text-[10px] font-semibold" style={{ color: "rgba(251,191,36,0.70)" }}>
          ⏳ ใกล้เฉลย
        </span>
        <span className="text-[12px] font-black tabular-nums" style={{ color: "#fbbf24" }}
          suppressHydrationWarning>
          {label}
        </span>
      </div>
      <div className="h-[2px] w-full" style={{ background: "rgba(251,191,36,0.12)" }}>
        <div className="h-full transition-[width] duration-[30000ms] ease-linear"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#b45309,#fbbf24)", boxShadow: "0 0 4px rgba(251,191,36,0.4)" }} />
      </div>
    </div>
  );
}

// ── EndingSoonBadge — realtime label for ending-soon state badge ──
function EndingSoonBadge({ endsAt, fallback }: { endsAt?: string; fallback?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { label, tier } = useCountdown(mounted ? endsAt : undefined);
  const display = !mounted ? (fallback ?? "") : tier === "expired" ? "หมดเวลา" : (endsAt ? label : (fallback ?? ""));
  return (
    <span
      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm"
      style={{ background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.50)", color: "#fbbf24" }}
    >
      <span className="text-[10px]">⏳</span>
      <span className="text-[10px] font-black" suppressHydrationWarning>{display}</span>
    </span>
  );
}

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

// ── Countdown clock ───────────────────────────────────────────────
function CountdownClock({ endsAt }: { endsAt: string }) {
  const [diff, setDiff] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(new Date(endsAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (diff <= 0) return (
    <span className="text-[13px] font-black" style={{ color: "#5ED3A6" }}>✓ หมดเวลา</span>
  );

  // > 24h → แสดงแค่ วัน ชม.
  if (diff >= 86_400_000) {
    const days = Math.floor(diff / 86_400_000);
    const hrs  = Math.floor((diff % 86_400_000) / 3_600_000);
    return (
      <div className="flex items-end gap-1.5">
        <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: "#f97316" }} suppressHydrationWarning>{days}</span>
        <span className="text-[10px] pb-0.5" style={{ color: "var(--text-muted)" }}>วัน</span>
        {hrs > 0 && <>
          <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: "#f97316" }} suppressHydrationWarning>{pad(hrs)}</span>
          <span className="text-[10px] pb-0.5" style={{ color: "var(--text-muted)" }}>ชม.</span>
        </>}
      </div>
    );
  }

  // < 24h → HH MM SS แบบ full
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  const units = h > 0
    ? [{ v: h, u: "ชม." }, { v: m, u: "นาที" }, { v: s, u: "วิ" }]
    : [{ v: m, u: "นาที" }, { v: s, u: "วิ" }];

  return (
    <div className="flex items-end gap-2">
      {units.map(({ v, u }) => (
        <div key={u} className="flex items-end gap-0.5">
          <span className="text-[28px] font-black tabular-nums leading-none"
            style={{ color: "#ef4444", fontVariantNumeric: "tabular-nums" }}
            suppressHydrationWarning>
            {pad(v)}
          </span>
          <span className="text-[10px] pb-0.5" style={{ color: "var(--text-muted)" }}>{u}</span>
        </div>
      ))}
    </div>
  );
}

// ── Crypto sparkline (no axes) ────────────────────────────────────
type SparkTF = "5m" | "15m" | "1h" | "4h" | "1d";

function suggestTF(endsAt?: string): SparkTF {
  if (!endsAt) return "1d";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff < 3_600_000)   return "5m";
  if (diff < 21_600_000)  return "15m";
  if (diff < 86_400_000)  return "1h";
  if (diff < 604_800_000) return "4h";
  return "1d";
}

const TF_OPTIONS: { label: string; value: SparkTF; interval: string; limit: number }[] = [
  { label: "5m",  value: "5m",  interval: "5m",  limit: 60  },
  { label: "15m", value: "15m", interval: "15m", limit: 48  },
  { label: "1h",  value: "1h",  interval: "1h",  limit: 48  },
  { label: "4h",  value: "4h",  interval: "4h",  limit: 42  },
  { label: "1d",  value: "1d",  interval: "1d",  limit: 30  },
];

function useCryptoSparkline(symbol: string, tf: SparkTF) {
  const [data, setData] = useState<{ p: number }[]>([]);
  const [live, setLive] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const cfg = TF_OPTIONS.find(t => t.value === tf)!;
    const sym = `${symbol.toUpperCase()}USDT`;
    fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${cfg.interval}&limit=${cfg.limit}`)
      .then(r => r.json())
      .then((rows: [number, string, string, string, string, ...unknown[]][]) => {
        setData(rows.map(r => ({ p: parseFloat(r[4]) })));
      })
      .catch(() => {});
  }, [symbol, tf]);

  useEffect(() => {
    const stream = `${symbol.toLowerCase()}usdt@aggTrade`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { p: string };
        const price = parseFloat(msg.p);
        if (isFinite(price)) setLive(price);
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [symbol]);

  return { data, live };
}

// ── Crypto Card (BTC / ETH / …) ───────────────────────────────────
function CryptoCard({ p }: { p: Prediction }) {
  const router = useRouter();
  const coin = p.coinSymbol ?? "BTC";
  const defaultTF = suggestTF(p.endsAt);
  const [tf, setTf] = useState<SparkTF>(defaultTF);
  const { data, live } = useCryptoSparkline(coin, tf);

  const rt = useRealtimeVotes(p.id, {
    yesPool: p.yesPoolRaw ?? 0,
    noPool: p.noPoolRaw ?? 0,
    participantCount: p.participants,
  });
  const rtTotal = rt.yesPool + rt.noPool || 1;
  const rtYesPct = p.yesPoolRaw != null ? Math.round((rt.yesPool / rtTotal) * 100) : p.yesPercent;
  const { yes: yesW, no: noW } = clampPct(rtYesPct);

  const last = live ?? data[data.length - 1]?.p ?? 0;
  const first = data[0]?.p ?? last;
  const isUp = last >= first;
  const changePct = first > 0 ? (((last - first) / first) * 100).toFixed(2) : "0.00";
  const chartColor = isUp ? "#f97316" : "#ef4444";
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Link href={`/predict/${p.id}`}>
      <article className="glass card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full">

        {/* ── Thumbnail (same h-36 as other cards) ── */}
        <div className="relative h-28 flex-shrink-0 overflow-hidden bg-gradient-to-br from-yellow-950 via-amber-900 to-yellow-950">
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, #f97316, #fbbf24, transparent)" }} />

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            /* No image → show sparkline as the hero */
            <div className="absolute inset-0">
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`cg-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="p" stroke={chartColor} strokeWidth={2}
                      fill={`url(#cg-${p.id})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-4xl opacity-30">₿</div>
              )}
            </div>
          )}

          {/* Crypto + coin pill */}
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: "rgba(202,138,4,0.85)" }}>
            Crypto · {coin}
          </span>

          {/* LIVE / participants badge */}
          {p.hot ? (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
              <span className="card-live-dot" /> LIVE
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-orange-300">
              <Flame className="w-3 h-3 text-orange-400" />
              {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}
            </span>
          )}

          {/* TF tabs overlaid bottom-left when image present */}
          {p.imageUrl && (
            <div className="absolute bottom-2 left-2 flex gap-0.5">
              {TF_OPTIONS.map(t => (
                <button key={t.value} type="button"
                  onClick={(e) => { e.preventDefault(); setTf(t.value); }}
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded-md backdrop-blur-sm transition-all"
                  style={tf === t.value
                    ? { background: "rgba(249,115,22,0.85)", color: "#fff" }
                    : { background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.5)" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-3 pt-2.5 pb-2.5 flex flex-col gap-2 flex-1">

          {/* Title */}
          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-yellow-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Live price + sparkline (when image takes the hero slot) */}
          {p.imageUrl ? (
            <div className="flex flex-col gap-1.5">
              {last > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black tabular-nums text-white">${fmt(last)}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isUp ? "#4ade80" : "#f87171" }}>
                    {isUp ? "+" : ""}{changePct}%
                  </span>
                </div>
              )}
              {/* Mini sparkline below price */}
              <div className="rounded-lg overflow-hidden" style={{ height: 44, background: "rgba(0,0,0,0.25)" }}>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={44}>
                    <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`cgs-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="p" stroke={chartColor} strokeWidth={1.5}
                        fill={`url(#cgs-${p.id})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              {/* TF tabs */}
              <div className="flex gap-0.5">
                {TF_OPTIONS.map(t => (
                  <button key={t.value} type="button"
                    onClick={(e) => { e.preventDefault(); setTf(t.value); }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md transition-all"
                    style={tf === t.value
                      ? { background: "rgba(249,115,22,0.25)", color: "#f97316", border: "1px solid rgba(249,115,22,0.4)" }
                      : { color: "rgba(255,255,255,0.25)" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* No image: price only (chart is in hero) */
            last > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black tabular-nums text-white">${fmt(last)}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isUp ? "#4ade80" : "#f87171" }}>
                    {isUp ? "+" : ""}{changePct}%
                  </span>
                </div>
                {/* TF tabs */}
                <div className="flex gap-0.5">
                  {TF_OPTIONS.map(t => (
                    <button key={t.value} type="button"
                      onClick={(e) => { e.preventDefault(); setTf(t.value); }}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all"
                      style={tf === t.value
                        ? { background: "rgba(249,115,22,0.25)", color: "#f97316", border: "1px solid rgba(249,115,22,0.4)" }
                        : { color: "rgba(255,255,255,0.25)" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Countdown */}
          {p.endsAt && (
            <div className="flex items-center justify-between">
              <CountdownClock endsAt={p.endsAt} />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>ปิดรับ</span>
            </div>
          )}

          {/* Vote buttons — hidden if already voted */}
          {!p.userVote && (
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/predict/${p.id}?vote=yes`); }}
                className="py-2.5 rounded-xl text-[13px] font-black text-center transition-all hover:brightness-110 active:scale-95"
                style={{ background: "rgba(94,211,166,0.15)", border: "1px solid rgba(94,211,166,0.4)", color: "#5ED3A6" }}>
                ✓ {p.options?.[0]?.label ?? "ใช่"}
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/predict/${p.id}?vote=no`); }}
                className="py-2.5 rounded-xl text-[13px] font-black text-center transition-all hover:brightness-110 active:scale-95"
                style={{ background: "rgba(217,107,107,0.15)", border: "1px solid rgba(217,107,107,0.4)", color: "#D96B6B" }}>
                ✗ {p.options?.[1]?.label ?? "ไม่"}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-2 border-t border-white/[0.05]">
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3 h-3 object-contain" />
              {p.totalPool ?? p.yesPool}
            </span>
            <span>👥 {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}</span>
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
  const rt = useRealtimeVotes(p.id, {
    yesPool: p.yesPoolRaw ?? 0,
    noPool: p.noPoolRaw ?? 0,
    participantCount: p.participants,
  });
  const rtTotal = rt.yesPool + rt.noPool || 1;
  const rtYesPct = p.yesPoolRaw != null ? Math.round((rt.yesPool / rtTotal) * 100) : p.yesPercent;
  const { yes: yesW } = clampPct(rtYesPct);
  const totalPool = p.totalPool ?? p.yesPool;
  const gaugeColor = "#fbbf24";
  const finState = getCardState(p);

  return (
    <Link href={`/predict/${p.id}`} className="h-full block">
      <article
        className={`${STATE_ANIM[finState]} rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full`}
        style={{ border: STATE_BORDER[finState] }}
      >
        <StateTopBar state={finState} />

        {/* ── Thumbnail h-36 ── */}
        <div className={`relative h-28 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            <span className="text-5xl select-none opacity-50 group-hover:opacity-70 transition-opacity">{p.image ?? "₿"}</span>
          )}

          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
              style={{ background: cat.pill }}>
              {p.category}
            </span>
            {p.subcategory && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}>
                {p.subcategory}
              </span>
            )}
          </div>

          <StateBadge state={finState} p={p} participantCount={rt.participantCount} />

          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-3 pt-2.5 pb-2.5 flex flex-col gap-2 flex-1">
          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-yellow-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Gauge + vote buttons */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <DonutGauge percent={yesW} color={gaugeColor} size={64} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-black text-white leading-none">{yesW}%</span>
                <span className="text-[8px] text-[var(--text-muted)] mt-0.5">โอกาส</span>
              </div>
            </div>

            {!p.userVote && (
              <div className="flex flex-col gap-2 flex-1">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/predict/${p.id}?vote=yes`); }}
                  className="w-full py-2 rounded-xl text-sm font-bold text-center transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(94,211,166,0.15)", border: "1px solid rgba(94,211,166,0.4)", color: "#5ED3A6" }}>
                  ใช่
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/predict/${p.id}?vote=no`); }}
                  className="w-full py-2 rounded-xl text-sm font-bold text-center transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(217,107,107,0.15)", border: "1px solid rgba(217,107,107,0.4)", color: "#D96B6B" }}>
                  ไม่
                </button>
              </div>
            )}
          </div>

          <UrgencyBar endsAt={p.endsAt} />

          {/* Footer */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <CountdownBadge timeLeft={p.timeLeft} endsAt={p.endsAt} />
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
              {totalPool}
            </span>
            <span className="flex items-center gap-1">
              👥 {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}
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

// ── Countdown display ─────────────────────────────────────────────
// CountdownBadge kept for any remaining call sites — wraps LiveTimer
function CountdownBadge({ timeLeft, endsAt, size = "sm" }: { timeLeft?: string; endsAt?: string; size?: "sm" | "lg" }) {
  const isResolved = timeLeft === "เฉลยแล้ว" || timeLeft?.includes("เฉลย");
  const isLive = timeLeft?.includes("LIVE") || timeLeft?.includes("กำลัง");

  if (isResolved) return (
    <span className={`inline-flex items-center gap-1 font-bold ${size === "lg" ? "text-[13px]" : "text-[11px]"}`}
      style={{ color: "#5ED3A6" }}>✓ เฉลยแล้ว</span>
  );
  if (isLive) return (
    <span className={`inline-flex items-center gap-1.5 font-black ${size === "lg" ? "text-[13px]" : "text-[11px]"}`}
      style={{ color: "#f87171" }}><span className="card-live-dot" /> กำลังเฉลย…</span>
  );
  return <LiveTimer endsAt={endsAt} fallback={timeLeft} />;
}

function QuickCountdown({ endsAt, fallback }: { endsAt?: string; fallback?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { label, tier, mm, ss } = useCountdown(mounted ? endsAt : undefined);

  const isCritical = tier === "critical" || tier === "minute";
  const display = !mounted ? (fallback ?? "—") : tier === "expired" ? "หมดเวลา" : tier === "critical" ? `${mm}:${ss}` : label;
  const color = isCritical ? "#f87171" : tier === "expired" ? "#5ED3A6" : "rgba(255,255,255,0.55)";
  const glow = isCritical ? "0 0 12px rgba(239,68,68,0.5)" : undefined;

  return (
    <div className="flex flex-col items-end flex-shrink-0">
      <span
        className={`font-black tabular-nums leading-none ${isCritical ? "text-[18px]" : "text-[15px]"}`}
        style={{ color, textShadow: glow }}
        suppressHydrationWarning
      >
        {isCritical && <span className="text-[11px] mr-0.5 opacity-70">⏱</span>}{display}
      </span>
      <span className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>เหลือเวลาทาย</span>
    </div>
  );
}

// ── Quick Prediction Card (≤15 min) ───────────────────────────────
function QuickCard({ p }: { p: Prediction }) {
  const router = useRouter();
  const cat = catConfig[p.category] ?? DEFAULT_CAT;
  const rt = useRealtimeVotes(p.id, {
    yesPool: p.yesPoolRaw ?? 0,
    noPool: p.noPoolRaw ?? 0,
    participantCount: p.participants,
  });
  const rtTotal = rt.yesPool + rt.noPool || 1;
  const rtYesPct = p.yesPoolRaw != null ? Math.round((rt.yesPool / rtTotal) * 100) : p.yesPercent;
  const { yes: yesW, no: noW } = clampPct(rtYesPct);
  const totalCount = rt.participantCount > 0 ? rt.participantCount : p.participants;

  const state = getCardState(p);
  const { tier: cdTier } = useCountdown(p.endsAt);
  const isExpired = cdTier === "expired";
  const { resolution, dismissed, dismiss } = useResolution(p.id, p.resolution);
  const hasVoted = !!p.userVote;

  const COLORS = ["#5ED3A6", "#f87171", "#60a5fa", "#fb923c", "#c084fc", "#f472b6"];
  const opts: { label: string; percent: number }[] = p.options && p.options.length > 0
    ? p.options
    : [{ label: p.yesLabel ?? "ใช่", percent: yesW }, { label: p.noLabel ?? "ไม่", percent: noW }];
  const isBinary = opts.length === 2;

  // ผู้ใช้โหวตถูกหรือผิด
  const userWon = hasVoted && resolution != null && (() => {
    const vote = p.userVote!.choiceLabel.toLowerCase();
    const yesLbl = (p.yesLabel ?? "ใช่").toLowerCase();
    return resolution === true ? vote === yesLbl : vote !== yesLbl;
  })();

  // ถ้า dismissed แล้วไม่ต้องแสดง overlay
  const showOverlay = isExpired && !dismissed;
  // ถ้า resolved แล้วและ user โหวต → แสดงผล; ถ้าไม่โหวต → แสดง "รอเฉลย" แล้วหายไปได้
  const showResult = showOverlay && resolution != null;
  const showWaiting = showOverlay && resolution == null;

  if (isExpired && dismissed) return null;

  return (
    <Link href={`/predict/${p.id}`} className="h-full block">
      <article
        className={`${isExpired ? "glass" : STATE_ANIM[state]} rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full relative`}
        style={{ border: isExpired ? "1px solid rgba(255,255,255,0.07)" : STATE_BORDER[state] }}
      >
        <StateTopBar state={isExpired ? "normal" : state} />

        {/* ── Waiting for resolution overlay ── */}
        {showWaiting && !hasVoted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: "rgba(5,4,14,0.85)", backdropFilter: "blur(2px)" }}>
            <span className="text-2xl mb-2">⏳</span>
            <p className="text-[13px] font-black text-white">หมดเวลาโหวตแล้ว</p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>กำลังรอประกาศผล…</p>
            <button onClick={(e) => { e.preventDefault(); dismiss(); }}
              className="mt-3 text-[11px] px-3 py-1.5 rounded-full transition-all hover:brightness-110"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>
              ปิด
            </button>
          </div>
        )}

        {/* ── Waiting (user voted) — show bar dimmed, wait for result ── */}
        {showWaiting && hasVoted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: "rgba(5,4,14,0.80)", backdropFilter: "blur(2px)" }}>
            <div className="flex flex-col items-center gap-2 px-5 text-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse inline-block" />
                <p className="text-[12px] font-black text-white">รอประกาศผล…</p>
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                คุณทาย <span className="font-bold" style={{ color: "#a78bfa" }}>{p.userVote!.choiceLabel}</span> · {p.userVote!.amount.toLocaleString()} ญาณ
              </p>
            </div>
          </div>
        )}

        {/* ── Result overlay ── */}
        {showResult && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
            style={{
              background: hasVoted
                ? userWon ? "rgba(5,40,20,0.92)" : "rgba(40,5,10,0.92)"
                : "rgba(5,4,14,0.88)",
              backdropFilter: "blur(3px)",
            }}>
            <div className="flex flex-col items-center gap-2 px-5 text-center">
              {hasVoted ? (
                <>
                  <span className="text-3xl">{userWon ? "🏆" : "💀"}</span>
                  <p className="text-[15px] font-black" style={{ color: userWon ? "#4ade80" : "#f87171" }}>
                    {userWon ? "ทายถูก!" : "ทายผิด"}
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    คุณทาย <span className="font-bold text-white">{p.userVote!.choiceLabel}</span>
                    {userWon && <span className="ml-1" style={{ color: "#4ade80" }}>+{p.userVote!.amount.toLocaleString()} ญาณ</span>}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-2xl">📊</span>
                  <p className="text-[13px] font-black text-white">ประกาศผลแล้ว</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    ผล: <span className="font-bold text-white">{resolution ? (p.yesLabel ?? "ใช่") : (p.noLabel ?? "ไม่")}</span>
                  </p>
                </>
              )}
              <button
                onClick={(e) => { e.preventDefault(); dismiss(); }}
                className="mt-2 text-[12px] font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
                style={{
                  background: userWon ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${userWon ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)"}`,
                  color: userWon ? "#4ade80" : "rgba(255,255,255,0.6)",
                }}>
                รับทราบ ✓
              </button>
            </div>
          </div>
        )}

        {/* Thumbnail — only when image exists */}
        {p.imageUrl && (
          <div className="relative h-24 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
          </div>
        )}

        <div className="px-3.5 pt-3 pb-3 flex flex-col gap-3 flex-1" style={isExpired ? { opacity: 0.35, pointerEvents: "none" } : undefined}>

          {/* Header: badges left, countdown right */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.35)", color: "#fb923c" }}>
                <Zap className="w-2.5 h-2.5" /> QUICK
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: cat.pill }}>
                {p.category}
              </span>
              {p.subcategory && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                  {p.subcategory}
                </span>
              )}
            </div>
            <QuickCountdown endsAt={p.endsAt} fallback={p.timeLeft} />
          </div>

          {/* Title */}
          <h3 className="text-[17px] font-black text-white leading-snug line-clamp-2 group-hover:text-orange-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Vote bar + percentages */}
          {(() => {
            return (
              <>
                {/* Percentages row */}
                <div className={`flex items-end ${isBinary ? "justify-between" : "gap-4"}`}>
                  {opts.map((opt, i) => {
                    const color = COLORS[i] ?? COLORS[0];
                    const count = totalCount > 0 ? Math.round(totalCount * opt.percent / 100) : null;
                    return (
                      <div key={opt.label} className={`flex flex-col ${i === opts.length - 1 && isBinary ? "items-end" : ""}`}>
                        <span className="text-[20px] font-black leading-none tabular-nums" style={{ color }}>{opt.percent}%</span>
                        {count !== null && (
                          <span className="text-[10px] font-semibold mt-0.5" style={{ color: color + "99" }}>
                            {count.toLocaleString()} คน
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Thick segmented bar */}
                <div className="flex rounded-full overflow-hidden" style={{ height: 8 }}>
                  {opts.map((opt, i) => (
                    <div key={opt.label} className="transition-all duration-700"
                      style={{ width: `${opt.percent}%`, background: COLORS[i] ?? COLORS[0] }} />
                  ))}
                </div>
                {/* Vote buttons — hidden if already voted */}
                {!hasVoted && (
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(opts.length, 3)}, 1fr)` }}>
                    {opts.map((opt, i) => {
                      const color = COLORS[i] ?? COLORS[0];
                      return (
                        <button key={opt.label}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/predict/${p.id}?vote=${i}`); }}
                          className="py-3 rounded-xl text-[13px] font-black text-center transition-all hover:brightness-110 active:scale-95"
                          style={{
                            background: `${color}22`,
                            border: `1.5px solid ${color}70`,
                            color,
                          }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
          {/* Footer */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3 h-3 object-contain" />
              {p.totalPool ?? p.yesPool}
            </span>
            <span>👥 {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}</span>
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

// ── Epic Prediction Card (3d–1mo) ─────────────────────────────────
function EpicCard({ p }: { p: Prediction }) {
  const cat = catConfig[p.category] ?? DEFAULT_CAT;
  const rt = useRealtimeVotes(p.id, {
    yesPool: p.yesPoolRaw ?? 0,
    noPool: p.noPoolRaw ?? 0,
    participantCount: p.participants,
  });
  const rtTotal = rt.yesPool + rt.noPool || 1;
  const rtYesPct = p.yesPoolRaw != null ? Math.round((rt.yesPool / rtTotal) * 100) : p.yesPercent;
  const { yes: yesW, no: noW } = clampPct(rtYesPct);

  const options: { label: string; percent: number }[] = p.options ?? [
    { label: "ใช่", percent: yesW },
    { label: "ไม่ใช่", percent: noW },
  ];

  const totalPool = p.totalPool ?? p.yesPool;

  const epicState = getCardState(p);

  return (
    <Link href={`/predict/${p.id}`} className="h-full block">
      <article
        className={`${STATE_ANIM[epicState]} rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full`}
        style={{ border: epicState === "normal" ? "1px solid rgba(215,181,109,0.25)" : STATE_BORDER[epicState] }}
      >
        {/* Top glow stripe */}
        <div className="h-0.5 w-full" style={{
          background: "linear-gradient(90deg, transparent, #D7B56D, #fbbf24, #D7B56D, transparent)",
        }} />

        {/* Hero image — taller for epic */}
        <div className={`relative h-36 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            <span className="text-6xl select-none opacity-40 group-hover:opacity-60 transition-opacity">{p.image ?? "⚔️"}</span>
          )}

          {/* Gold radial glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(215,181,109,0.18) 0%, transparent 70%)" }} />

          {/* Epic badge */}
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
            style={{ background: "rgba(215,181,109,0.2)", border: "1px solid rgba(215,181,109,0.5)", color: "#D7B56D" }}>
            <Crown className="w-3 h-3" /> EPIC
          </span>

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {p.subcategory && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}>
                {p.subcategory}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
              style={{ background: cat.pill }}>
              {p.category}
            </span>
          </div>

          {p.hot && (
            <span className="absolute top-9 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
              <span className="card-live-dot" /> LIVE
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* Body */}
        <div className="px-3 pt-2.5 pb-2.5 flex flex-col gap-2 flex-1">

          <h3 className="text-[15px] font-black leading-snug line-clamp-2 group-hover:text-yellow-100 transition-colors"
            style={{ color: "#F3F1FF" }}>
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          {/* Prize pool — prominent for epic */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: "rgba(215,181,109,0.08)", border: "1px solid rgba(215,181,109,0.15)" }}>
            <span className="text-[11px] text-[var(--text-muted)]">Prize Pool</span>
            <span className="flex items-center gap-1 text-[14px] font-black" style={{ color: "#D7B56D" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-4 h-4 object-contain" />
              {totalPool}
            </span>
          </div>

          {/* Options */}
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {options.map((opt, i) => (
              <OptionRow key={opt.label} label={opt.label} percent={opt.percent} index={i} />
            ))}
          </div>

          <UrgencyBar endsAt={p.endsAt} />

          {/* Footer */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <CountdownBadge timeLeft={p.timeLeft} endsAt={p.endsAt} />
            <span className="flex items-center gap-1">
              👥 {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}
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
  if (p.predictionType === "quick") return <QuickCard p={p} />;
  if (p.predictionType === "epic")  return <EpicCard p={p} />;
  if (p.category === "การเงิน")    return <FinanceCard p={p} />;

  const cat = catConfig[p.category] ?? DEFAULT_CAT;

  const rt = useRealtimeVotes(p.id, {
    yesPool: p.yesPoolRaw ?? 0,
    noPool: p.noPoolRaw ?? 0,
    participantCount: p.participants,
  });
  const rtTotal = rt.yesPool + rt.noPool || 1;
  const rtYesPct = p.yesPoolRaw != null ? Math.round((rt.yesPool / rtTotal) * 100) : p.yesPercent;
  const { yes: yesW, no: noW } = clampPct(rtYesPct);

  const options: { label: string; percent: number }[] = p.options ?? [
    { label: "ใช่", percent: yesW },
    { label: "ไม่ใช่", percent: noW },
  ];

  const totalPool = p.totalPool ?? p.yesPool;
  const state = getCardState(p);
  const bgTint = STATE_BG_TINT[state];

  return (
    <Link href={`/predict/${p.id}`} className="h-full block">
      <article
        className={`${STATE_ANIM[state]} rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full`}
        style={{ border: STATE_BORDER[state], ...(bgTint ? { background: "rgba(18,16,28,0.92)" } : {}) }}
      >
        <StateTopBar state={state} />

        {/* ── Thumbnail ── */}
        <div className={`relative h-28 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
          {bgTint && (
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: bgTint }} />
          )}

          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover"
              style={{ objectPosition: p.imagePosition ?? "50% 50%" }} />
          ) : (
            <span className="text-5xl select-none opacity-50 group-hover:opacity-70 transition-opacity">{p.image ?? "🔮"}</span>
          )}

          {/* Category pill */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
              style={{ background: cat.pill }}>
              {p.category}
            </span>
            {p.subcategory && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}>
                {p.subcategory}
              </span>
            )}
          </div>

          {/* State badge */}
          <StateBadge state={state} p={p} participantCount={rt.participantCount} />

          {/* Category glow for live/hot */}
          {(state === "live" || state === "hot") && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 100%, ${cat.glow} 0%, transparent 65%)` }} />
          )}

          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
        </div>

        {/* ── Body ── */}
        <div className="px-3 pt-2.5 pb-2.5 flex flex-col gap-2 flex-1">

          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-purple-100 transition-colors">
            {p.title}
          </h3>

          {p.userVote && <VotedBadge choiceLabel={p.userVote.choiceLabel} amount={p.userVote.amount} />}

          <div className="flex flex-col divide-y divide-white/[0.04] mt-0.5">
            {options.map((opt, i) => (
              <OptionRow key={opt.label} label={opt.label} percent={opt.percent} index={i} />
            ))}
          </div>

          {/* State-aware urgency countdown */}
          <UrgencyBar endsAt={p.endsAt} />

          {/* Footer */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)] mt-auto pt-2 border-t border-white/[0.05]">
            <CountdownBadge timeLeft={p.timeLeft} endsAt={p.endsAt} />
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
              {totalPool}
            </span>
            <span className="flex items-center gap-1">
              👥 {rt.participantCount >= 1000 ? `${(rt.participantCount / 1000).toFixed(1)}K` : rt.participantCount}
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
