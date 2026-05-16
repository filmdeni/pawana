"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, TrendingUp, TrendingDown, Lock } from "lucide-react";
import Image from "next/image";
import VotePanel, { type VoteFeedbackData } from "@/components/VotePanel";
import ProbabilityChart from "@/components/ProbabilityChart";
import { clampPct } from "@/lib/poolDisplay";

const TIER_THRESHOLDS = [
  { minLevel: 0,  label: "ผู้สังเกต",  color: "#cd7f32" },
  { minLevel: 10, label: "ผู้ทำนาย",  color: "#b0b8c8" },
  { minLevel: 20, label: "นิมิต",      color: "#D7B56D" },
  { minLevel: 35, label: "ผู้รู้แจ้ง", color: "#e2f0ff" },
  { minLevel: 50, label: "โพธิสัตว์",  color: "#88eeff" },
  { minLevel: 70, label: "ตำนาน",      color: "#d480ff" },
];
function getTierInfo(level: number) {
  let current = TIER_THRESHOLDS[0];
  let next: (typeof TIER_THRESHOLDS)[0] | null = null;
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (level >= TIER_THRESHOLDS[i].minLevel) { current = TIER_THRESHOLDS[i]; next = TIER_THRESHOLDS[i + 1] ?? null; }
  }
  return { current, next };
}

function FeedbackPanel({ feedback, predictionId, onDone }: { feedback: VoteFeedbackData; predictionId: string; onDone: () => void }) {
  const [xpFilled, setXpFilled] = useState(false);
  useEffect(() => {
    try { sessionStorage.removeItem(`pawana_just_voted_${predictionId}`); } catch {}
    const t = setTimeout(() => setXpFilled(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { current: tier, next: nextTier } = getTierInfo(feedback.level);
  const xpAfter = feedback.currentXp + feedback.xpGained;
  const xpToNextLevel = feedback.xpPerLevel - (xpAfter % feedback.xpPerLevel);
  const barBefore = ((feedback.currentXp % feedback.xpPerLevel) / feedback.xpPerLevel) * 100;
  const barAfter = Math.min(((xpAfter % feedback.xpPerLevel) / feedback.xpPerLevel) * 100, 100);

  const color  = feedback.choiceIsYes ? "#5ED3A6" : "#D96B6B";
  const bg     = feedback.choiceIsYes ? "rgba(94,211,166,0.10)" : "rgba(217,107,107,0.10)";
  const border = feedback.choiceIsYes ? "rgba(94,211,166,0.35)" : "rgba(217,107,107,0.35)";

  return (
    <div className="space-y-4">
      {/* Choice row */}
      <div className="px-4 py-3 rounded-xl flex items-center gap-2"
        style={{ background: bg, border: `1px solid ${border}` }}>
        <span className="text-base">✨</span>
        <span className="text-sm font-semibold" style={{ color }}>
          คุณเลือก <strong>{feedback.choiceLabel}</strong>
        </span>
      </div>

      {/* Agree % */}
      <div className="space-y-2">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: xpFilled ? `${feedback.agreePct}%` : "0%", background: color }} />
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
          <span style={{ color, fontWeight: 800 }}>{feedback.agreePct}%</span>{" "}ของผู้ทายคิดเหมือนคุณ
        </p>
      </div>

      {/* XP gained */}
      <div className="flex justify-center">
        <div className="px-5 py-2 rounded-full text-sm font-black"
          style={{ background: "rgba(111,75,255,0.2)", border: "1px solid rgba(111,75,255,0.4)", color: "#a78bfa" }}>
          ⚡ +{feedback.xpGained} XP
        </div>
      </div>

      {/* XP bar */}
      <div className="space-y-1.5">
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${barBefore}%`, background: tier.color }} />
          <div className="absolute top-0 h-full rounded-full transition-all duration-700"
            style={{ left: `${barBefore}%`, width: xpFilled ? `${Math.max(0, barAfter - barBefore)}%` : "0%", background: tier.color, boxShadow: `0 0 8px ${tier.color}80` }} />
        </div>
        <div className="flex justify-between text-[11px]">
          <span style={{ color: tier.color, fontWeight: 700 }}>Lv.{feedback.level} · {tier.label}</span>
          {nextTier ? (
            <span style={{ color: "rgba(255,255,255,0.4)" }}>
              อีก <strong style={{ color: tier.color }}>{xpToNextLevel.toLocaleString()} XP</strong> → <span style={{ color: nextTier.color }}>{nextTier.label}</span>
            </span>
          ) : (
            <span style={{ color: tier.color, fontWeight: 700 }}>ระดับสูงสุดแล้ว</span>
          )}
        </div>
      </div>

      {/* Coins notice */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <Image src="/images/point2.png" alt="ญาณ" width={14} height={14} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>ญาณฯ ถูกหัก — รอผลเพื่อรับคืนพร้อมกำไร</span>
      </div>

      {/* Waiting section */}
      <div className="px-4 py-4 rounded-xl text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>🏛 รอประกาศผล</p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>ระบบจะแจ้งผลอัตโนมัติเมื่อผู้ดูแลเฉลย</p>
      </div>

      {/* CTA */}
      <button
        onClick={onDone}
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97]"
        style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", boxShadow: "0 4px 24px rgba(34,197,94,0.35)" }}
      >
        รับทราบ ✓
      </button>
    </div>
  );
}

function useCountdown(endsAt: string) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, expired: diff === 0 };
}

function VotedSummaryCard({
  userVote, choiceLabel, endsAt, yesPool, noPool,
}: {
  userVote: { choice: boolean; choice_index?: number | null; amount: number };
  choiceLabel: string;
  endsAt: string;
  yesPool: number;
  noPool: number;
}) {
  const { h, m, s, expired } = useCountdown(endsAt);
  const pad = (n: number) => String(n).padStart(2, "0");

  const total = yesPool + noPool || 1;
  const selectedPool = userVote.choice ? yesPool : noPool;
  const opposingPool = userVote.choice ? noPool : yesPool;
  const amt = userVote.amount;
  const potentialWin = Math.floor(amt + (amt / (selectedPool + amt)) * opposingPool * 0.95);
  const profit = potentialWin - amt;
  const multiplier = amt > 0 ? (potentialWin / amt).toFixed(1) : "0";

  return (
    <div className="mx-4 mt-4 mb-4 space-y-2">
      {/* Choice locked */}
      <div className="px-4 py-4 rounded-xl flex items-center gap-3"
        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <Lock className="w-4 h-4" style={{ color: "#4ade80" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>คำทำนายของคุณ</p>
          <p className="text-base font-black text-white flex items-center gap-1.5">
            <span style={{ color: "#4ade80" }}>✓</span> {choiceLabel}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(74,222,128,0.6)" }}>
            {amt.toLocaleString()} ญาณ ถูกล็อคแล้ว
          </p>
        </div>
      </div>

      {/* Payout */}
      <div className="px-4 py-3.5 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>ถ้าถูกต้อง คาดว่าได้รับ</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black" style={{ color: "#facc15" }}>
              {potentialWin.toLocaleString()} <span className="text-sm font-bold">ญาณ</span>
            </p>
            {profit > 0 && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: "#4ade80" }}>
                +{profit.toLocaleString()} กำไรสุทธิ
              </p>
            )}
          </div>
          <div className="px-3 py-2 rounded-xl text-center"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)" }}>
            <p className="text-lg font-black" style={{ color: "#a78bfa" }}>{multiplier}x</p>
            <p className="text-[9px] font-bold tracking-widest" style={{ color: "rgba(167,139,250,0.6)" }}>PROFIT</p>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div className="px-4 py-3.5 rounded-xl text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[11px] mb-2 font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
          {expired ? "หมดเวลาแล้ว" : "ผลจะออกใน"}
        </p>
        {!expired && (
          <div className="flex items-end justify-center gap-3">
            {[{ val: h, unit: "ชม." }, { val: m, unit: "นาที" }, { val: s, unit: "วินาที" }].map(({ val, unit }) => (
              <div key={unit} className="text-center">
                <p className="text-2xl font-black text-white tabular-nums leading-none">{pad(val)}</p>
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{unit}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const OPTION_BG_COLORS = [
  "rgba(34,197,94,0.15)",
  "rgba(239,68,68,0.15)",
  "rgba(251,191,36,0.15)",
  "rgba(139,92,246,0.15)",
  "rgba(59,130,246,0.15)",
];
const OPTION_TEXT_COLORS = ["text-green-400", "text-red-400", "text-yellow-400", "text-purple-400", "text-blue-400"];
const OPTION_POOL_COLORS = ["text-green-600", "text-red-600", "text-yellow-600", "text-purple-600", "text-blue-600"];
const OPTION_BTN_YES = [
  "bg-green-500/20 hover:bg-green-500/35 text-green-300 border-green-500/30",
  "bg-red-500/20 hover:bg-red-500/35 text-red-300 border-red-500/30",
  "bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-300 border-yellow-500/30",
  "bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border-purple-500/30",
  "bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 border-blue-500/30",
];
const OPTION_BTN_NO = [
  "bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border-rose-700/30",
  "bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 border-orange-700/30",
  "bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border-amber-700/30",
  "bg-violet-900/30 hover:bg-violet-900/50 text-violet-300 border-violet-700/30",
  "bg-sky-900/30 hover:bg-sky-900/50 text-sky-300 border-sky-700/30",
];

interface VsModalProps {
  predictionId: string;
  yesPct: number;
  noPct: number;
  yesPool: number;
  noPool: number;
  initialYesPool: number;
  initialNoPool: number;
  endsAt: string;
  userVote?: { choice: boolean; choice_index?: number | null; amount: number } | null;
  isLoggedIn: boolean;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  optionPools?: number[] | null;
  userXp?: number;
  userLevel?: number;
  userBalance?: number;
  housePool?: number;
  predMaxBet?: number;
  initialChoice?: boolean | null;
  initialChoiceIndex?: number | null;
  isSports?: boolean;
  chartData?: Record<string, number | string>[];
  chartOptions?: string[];
}

export default function VsModal({
  predictionId,
  yesPct,
  noPct,
  yesPool,
  noPool,
  initialYesPool,
  initialNoPool,
  endsAt,
  userVote,
  isLoggedIn,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
  options,
  optionPools,
  userXp = 0,
  userLevel = 1,
  userBalance = 0,
  housePool = 500,
  predMaxBet = 1000,
  initialChoice = null,
  initialChoiceIndex = null,
  isSports = false,
  chartData,
  chartOptions,
}: VsModalProps) {
  const effectiveIndex = initialChoiceIndex !== null && initialChoiceIndex !== undefined
    ? initialChoiceIndex
    : initialChoice === true ? 0 : initialChoice === false ? 1 : null;
  const isExpired = new Date(endsAt) < new Date();
  const [open, setOpen] = useState(effectiveIndex !== null && isLoggedIn && !isExpired && !userVote);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(effectiveIndex);
  const [feedback, setFeedback] = useState<VoteFeedbackData | null>(null);
  const { yes: yesDisplay, no: noDisplay } = clampPct(yesPct);
  const router = useRouter();

  function handleVoteSuccess(fb?: VoteFeedbackData) {
    if (fb) {
      setFeedback(fb);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  function handleFeedbackDone() {
    setOpen(false);
    setFeedback(null);
    router.refresh();
  }

  const isMulti = options && options.length > 2;
  const resolvedOptions = isMulti ? options : [yesLabel, noLabel];
  const resolvedPools = isMulti ? (optionPools ?? options!.map(() => 0)) : [yesPool, noPool];
  const totalPool = resolvedPools.reduce((s, v) => s + v, 0) || 1;

  function openWithIndex(idx: number) {
    if (isExpired) return;
    if (!isLoggedIn) {
      router.push(`/login?next=/predict/${predictionId}`);
      return;
    }
    setSelectedChoiceIndex(idx);
    setOpen(true);
  }

  const initialVotePanelChoice = selectedChoiceIndex === null ? null : selectedChoiceIndex === 0;

  // ── Sports layout ─────────────────────────────────────────────
  if (isSports && chartData && chartOptions) {
    const mockPrevPools = resolvedPools.map((p) => Math.max(0, p - Math.floor(p * 0.15 + Math.random() * p * 0.2)));
    const prevTotal = mockPrevPools.reduce((s, v) => s + v, 0) || 1;

    return (
      <>
        {/* Chart */}
        <div className="px-4 pb-2">
          <ProbabilityChart options={chartOptions} data={chartData} />
        </div>

        {/* CTA หรือ voted summary */}
        <div className="px-4 pb-5 flex flex-col items-center gap-3">
          {userVote ? (
            <VotedSummaryCard
              userVote={userVote}
              choiceLabel={userVote.choice ? (resolvedOptions?.[0] ?? yesLabel) : (resolvedOptions?.[1] ?? noLabel)}
              endsAt={endsAt}
              yesPool={yesPool}
              noPool={noPool}
            />
          ) : (
            <>
              <button
                onClick={() => openWithIndex(0)}
                className="transition-all duration-200 active:scale-[0.96] hover:brightness-110"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/button.png" alt="กดทาย" className="h-24 w-auto object-contain" />
              </button>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                กดปุ่มเดียว → เลือกฝั่ง → ใส่จำนวน → ยืนยัน
              </p>
            </>
          )}
        </div>

        {/* Modal */}
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget && !feedback) setOpen(false); }}
          >
            <div
              className="w-full max-w-md relative overflow-hidden sm:rounded-3xl"
              style={{
                background: "linear-gradient(160deg, rgba(12,5,28,0.98) 0%, rgba(18,8,40,0.98) 50%, rgba(8,4,20,0.98) 100%)",
                border: "1px solid rgba(111,75,255,0.35)",
                boxShadow: "0 0 80px rgba(111,75,255,0.2), 0 0 0 1px rgba(111,75,255,0.1), 0 32px 64px rgba(0,0,0,0.8)",
                maxHeight: "92vh",
                borderRadius: "24px 24px 0 0",
              }}
            >
              {/* Ambient top glow */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)" }} />
              <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(111,75,255,0.15) 0%, transparent 70%)" }} />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(111,75,255,0.2)", border: "1px solid rgba(111,75,255,0.35)" }}>
                    <span className="text-base">⚡</span>
                  </div>
                  <div>
                    <h2 className="font-black text-white text-base leading-none">{feedback ? "ยืนยันการทาย" : "วางเดิมพัน"}</h2>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>{feedback ? "เลือกจำนวนญาณที่ต้องการ" : "เข้าสู่ตลาดทำนาย"}</p>
                  </div>
                </div>
                {!feedback && (
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </button>
                )}
              </div>

              {/* Scrollable body */}
              <div className="relative overflow-y-auto px-5 pb-6 pt-4" style={{ maxHeight: "calc(92vh - 70px)" }}>
                {feedback ? (
                  <FeedbackPanel feedback={feedback} predictionId={predictionId} onDone={handleFeedbackDone} />
                ) : (
                  <VotePanel
                    predictionId={predictionId}
                    initialYesPool={initialYesPool}
                    initialNoPool={initialNoPool}
                    endsAt={endsAt}
                    userVote={userVote}
                    initialChoice={initialVotePanelChoice}
                    onVoteSuccess={handleVoteSuccess}
                    yesLabel={yesLabel}
                    noLabel={noLabel}
                    options={isMulti ? options : null}
                    optionPools={isMulti ? optionPools : null}
                    userXp={userXp}
                    userLevel={userLevel}
                    userBalance={userBalance}
                    initialChoiceIndexOverride={selectedChoiceIndex}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Default layout ────────────────────────────────────────────
  return (
    <>
      {isMulti ? (
        /* Multi-option grid */
        <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-white/10">
          <div className={`grid gap-px bg-white/10`} style={{ gridTemplateColumns: `repeat(${Math.min(resolvedOptions!.length, 3)}, 1fr)` }}>
            {resolvedOptions!.map((label, i) => {
              const pool = resolvedPools[i] ?? 0;
              const pct = Math.round((pool / totalPool) * 100);
              return (
                <button
                  key={i}
                  onClick={() => openWithIndex(i)}
                  className={`py-4 text-center transition-all hover:brightness-125 ${OPTION_TEXT_COLORS[i % OPTION_TEXT_COLORS.length]}`}
                  style={{ background: OPTION_BG_COLORS[i % OPTION_BG_COLORS.length] }}
                >
                  <p className="text-xs font-semibold mb-1 truncate px-2">{label}</p>
                  <p className="text-2xl font-black leading-none">{pct}%</p>
                  <p className={`text-xs mt-1 ${OPTION_POOL_COLORS[i % OPTION_POOL_COLORS.length]}`}>{pool.toLocaleString()} ญาณ</p>
                </button>
              );
            })}
          </div>
          {/* pool bar */}
          <div className="flex h-1.5">
            {resolvedOptions!.map((_, i) => {
              const pool = resolvedPools[i] ?? 0;
              const pct = Math.round((pool / totalPool) * 100);
              const gradients = [
                "linear-gradient(90deg,#16a34a,#22c55e)",
                "linear-gradient(270deg,#b91c1c,#ef4444)",
                "linear-gradient(90deg,#b45309,#f59e0b)",
                "linear-gradient(90deg,#6d28d9,#8b5cf6)",
                "linear-gradient(90deg,#1d4ed8,#3b82f6)",
              ];
              return <div key={i} style={{ width: `${pct}%`, background: gradients[i % gradients.length], transition: "width 0.7s" }} />;
            })}
          </div>
        </div>
      ) : (
        /* Binary list style */
        <>
        {/* ถ้าทายแล้ว แสดงแค่ summary card ไม่มีปุ่มให้เลือก */}
        {userVote ? (
          <VotedSummaryCard
            userVote={userVote}
            choiceLabel={userVote.choice ? yesLabel : noLabel}
            endsAt={endsAt}
            yesPool={yesPool}
            noPool={noPool}
          />
        ) : (
          <div className="mx-4 mt-4 mb-4 space-y-2">
            {[
              { label: yesLabel, pool: yesPool, idx: 0 },
              { label: noLabel, pool: noPool, idx: 1 },
            ].map(({ label, pool, idx }) => {
              const total = yesPool + noPool || 1;
              const multiplier = pool > 0 ? (total / pool).toFixed(2) : "—";
              return (
                <button
                  key={idx}
                  onClick={() => openWithIndex(idx)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 bg-transparent text-[var(--text-primary)] hover:bg-white/5 transition-all text-left"
                >
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{multiplier}x</span>
                </button>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !feedback) setOpen(false); }}
        >
          <div
            className="w-full max-w-md relative overflow-hidden sm:rounded-3xl"
            style={{
              background: "linear-gradient(160deg, rgba(12,5,28,0.98) 0%, rgba(18,8,40,0.98) 50%, rgba(8,4,20,0.98) 100%)",
              border: "1px solid rgba(111,75,255,0.35)",
              boxShadow: "0 0 80px rgba(111,75,255,0.2), 0 0 0 1px rgba(111,75,255,0.1), 0 32px 64px rgba(0,0,0,0.8)",
              maxHeight: "92vh",
              borderRadius: "24px 24px 0 0",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)" }} />
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(111,75,255,0.15) 0%, transparent 70%)" }} />

            <div className="relative flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(111,75,255,0.2)", border: "1px solid rgba(111,75,255,0.35)" }}>
                  <span className="text-base">⚡</span>
                </div>
                <div>
                  <h2 className="font-black text-white text-base leading-none">ยืนยันการทาย</h2>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>เลือกจำนวนญาณที่ต้องการ</p>
                </div>
              </div>
              {!feedback && (
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              )}
            </div>

            <div className="relative overflow-y-auto px-5 pb-6 pt-4" style={{ maxHeight: "calc(92vh - 70px)" }}>
              {feedback ? (
                <FeedbackPanel feedback={feedback} predictionId={predictionId} onDone={handleFeedbackDone} />
              ) : (
              <VotePanel
                predictionId={predictionId}
                initialYesPool={initialYesPool}
                initialNoPool={initialNoPool}
                endsAt={endsAt}
                userVote={userVote}
                initialChoice={initialVotePanelChoice}
                onVoteSuccess={handleVoteSuccess}
                yesLabel={yesLabel}
                noLabel={noLabel}
                options={isMulti ? options : null}
                optionPools={isMulti ? optionPools : null}
                userXp={userXp}
                userLevel={userLevel}
                userBalance={userBalance}
                predMaxBet={predMaxBet}
                initialChoiceIndexOverride={selectedChoiceIndex}
              />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
