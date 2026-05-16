"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Flame, Crown } from "lucide-react";
import { castVoteAction } from "@/lib/actions/predictions";
import { useToast } from "@/components/Toast";
import { useRealtimeVotes } from "@/lib/hooks/useRealtimeVotes";

export interface VoteFeedbackData {
  choiceLabel: string;
  choiceIsYes: boolean;
  agreePct: number;
  xpGained: number;
  currentXp: number;
  xpPerLevel: number;
  level: number;
}

interface VotePanelProps {
  predictionId: string;
  initialYesPool: number;
  initialNoPool: number;

  predMaxBet?: number;
  endsAt: string;
  userVote?: { choice: boolean; choice_index?: number | null; amount: number } | null;
  initialChoice?: boolean | null;
  onVoteSuccess?: (feedback?: VoteFeedbackData) => void;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  optionPools?: number[] | null;
  userXp?: number;
  userLevel?: number;
  userBalance?: number;
  initialChoiceIndexOverride?: number | null;
}

const PCT_SHORTCUTS = [10, 25, 50, 100];

function playSelect(yes: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(yes ? 440 : 330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(yes ? 523 : 277, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

function playSuccess() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {}
}

const XP_PER_VOTE = 60;

// Fake avatar seeds for social proof
const AVATAR_SEEDS = ["A", "B", "C", "D", "E"];
const AVATAR_COLORS = ["#7C3AED", "#059669", "#DC2626", "#D97706", "#2563EB"];

export default function VotePanel({
  predictionId,
  initialYesPool,
  initialNoPool,
  predMaxBet = 1000,
  endsAt,
  userVote,
  initialChoice,
  onVoteSuccess,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
  options,
  optionPools: initialOptionPools,
  userXp = 0,
  userLevel = 1,
  userBalance = 0,
  initialChoiceIndexOverride,
}: VotePanelProps) {
  const isMulti = options && options.length > 2;
  const resolvedOptions = isMulti ? options : [yesLabel, noLabel];

  const initialChoiceIndex = initialChoiceIndexOverride ?? userVote?.choice_index ?? (initialChoice === true ? 0 : initialChoice === false ? 1 : null);
  const [choiceIndex, setChoiceIndex] = useState<number | null>(
    initialChoiceIndexOverride != null
      ? initialChoiceIndexOverride
      : isMulti
        ? initialChoiceIndex
        : (userVote?.choice === true ? 0 : userVote?.choice === false ? 1 : initialChoice === true ? 0 : initialChoice === false ? 1 : null)
  );
  const [optionPools, setOptionPools] = useState<number[]>(
    isMulti
      ? (initialOptionPools ?? options!.map(() => 0))
      : [initialYesPool, initialNoPool]
  );
  const choice = choiceIndex === null ? null : choiceIndex === 0;
  const maxBet = Math.min(Math.max(userBalance, 1), predMaxBet);
  const [amount, setAmount] = useState(() => Math.min(Math.max(Math.floor(maxBet * 0.1), 1), maxBet));
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState(!!userVote);
  const [flash, setFlash] = useState(false);
  const [popKey, setPopKey] = useState<boolean | null>(null);
  const { error: toastError } = useToast();

  const { yesPool, noPool, participantCount } = useRealtimeVotes(predictionId, {
    yesPool: initialYesPool,
    noPool: initialNoPool,
    participantCount: 0,
  });


  const isExpired = new Date(endsAt) < new Date();

  // Reward คำนวณจาก user pool จริงเท่านั้น (zero-sum — ไม่มี inflation)
  // ถ้าฝั่งตรงข้ามยังว่าง → ได้คืนเต็มจำนวน (no profit, no loss)
  const userYesPool = isMulti ? (optionPools[0] ?? 0) : yesPool;
  const userNoPool  = isMulti ? (optionPools[1] ?? 0) : noPool;
  const selectedUserPool = choiceIndex !== null
    ? (isMulti ? (optionPools[choiceIndex] ?? 0) : (choiceIndex === 0 ? userYesPool : userNoPool))
    : 0;
  const opposingUserPool = choiceIndex !== null
    ? (isMulti
        ? optionPools.reduce((s, v, i) => i !== choiceIndex ? s + v : s, 0)
        : (choiceIndex === 0 ? userNoPool : userYesPool))
    : 0;
  const potentialWin = choiceIndex !== null
    ? Math.floor(amount + (amount / (selectedUserPool + amount)) * opposingUserPool * 0.95)
    : 0;

  const multiplier = amount > 0 && potentialWin > 0 ? (potentialWin / amount).toFixed(1) : "0";

function handleChoiceSelect(idx: number) {
    setChoiceIndex(idx);
    setPopKey(idx === 0);
    playSelect(idx === 0);
    setTimeout(() => setPopKey(null), 300);
  }

  function handleVote() {
    if (choiceIndex === null) return;
    startTransition(async () => {
      const voteArg: boolean | number = isMulti ? choiceIndex : (choiceIndex === 0);
      const result = await castVoteAction(predictionId, voteArg, amount);
      if ("error" in result) {
        toastError("ทำนายไม่สำเร็จ", result.error);
      } else {
        if (result.newOptionPools) setOptionPools(result.newOptionPools);
        playSuccess();
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
        setVoted(true);

        // เก็บข้อมูล InstantFeedback ให้ ResultRevealOverlay ใช้เป็น phase แรก
        const myPool = optionPools[choiceIndex] ?? 0;
        const total = optionPools.reduce((s, v) => s + v, 0) || 1;
        const agreePct = Math.round((myPool / total) * 100);
        const feedbackData = {
          choiceLabel: resolvedOptions?.[choiceIndex] ?? (choiceIndex === 0 ? yesLabel : noLabel),
          choiceIsYes: choiceIndex === 0,
          agreePct,
          xpGained: XP_PER_VOTE,
          currentXp: userXp,
          xpPerLevel: Math.max(1, userLevel * 208),
          level: userLevel,
        };
        try { sessionStorage.setItem(`pawana_just_voted_${predictionId}`, JSON.stringify(feedbackData)); } catch {}

        onVoteSuccess?.(feedbackData);
      }
    });
  }

  if (isExpired) return null;

  if (voted) {
    return null;
  }

  // ── Confirm design ─────────────────────────────────────────
  const choiceLabel = choiceIndex !== null ? resolvedOptions![choiceIndex] : "";
  const choiceIsYes = choiceIndex === 0;
  const profitAmt = potentialWin - amount;
  const profitPct = amount > 0 && profitAmt > 0 ? Math.round((profitAmt / amount) * 100) : 0;

  return (
    <div className="space-y-4 relative">
      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
          style={{ background: choiceIsYes ? "rgba(94,211,166,0.15)" : "rgba(217,107,107,0.15)" }} />
      )}

      {/* ── Choice selector ── */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>คำทายของคุณ</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(resolvedOptions!.length, 2)}, 1fr)` }}>
          {resolvedOptions!.map((label, idx) => {
            const isSelected = choiceIndex === idx;
            const isYesOpt = idx === 0;
            const selColor = isYesOpt ? "#5ED3A6" : "#F87171";
            const selBg = isYesOpt ? "rgba(94,211,166,0.15)" : "rgba(248,113,113,0.15)";
            const selBorder = isYesOpt ? "rgba(94,211,166,0.5)" : "rgba(248,113,113,0.5)";
            return (
              <button
                key={idx}
                onClick={() => handleChoiceSelect(idx)}
                className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{
                  background: isSelected ? selBg : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${isSelected ? selBorder : "rgba(255,255,255,0.1)"}`,
                  color: isSelected ? selColor : "rgba(255,255,255,0.5)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                {isSelected && <span className="mr-1.5">✓</span>}{label}
              </button>
            );
          })}
        </div>
        {isMulti && resolvedOptions!.length > 2 && (
          <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${Math.min(resolvedOptions!.length - 2, 2)}, 1fr)` }}>
            {resolvedOptions!.slice(2).map((label, i) => {
              const idx = i + 2;
              const isSelected = choiceIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(idx)}
                  className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: isSelected ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isSelected ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: isSelected ? "#A78BFA" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {isSelected && <span className="mr-1.5">✓</span>}{label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Amount ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>ญาณที่ใช้ทาย</p>
          <div className="flex items-center gap-1.5">
            <Image src="/images/point2.png" alt="ญาณ" width={16} height={16} className="flex-shrink-0" />
            <span className="text-lg font-black text-white">{amount.toLocaleString()}</span>
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={maxBet}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22c55e ${Math.round((amount / maxBet) * 100)}%, rgba(255,255,255,0.12) ${Math.round((amount / maxBet) * 100)}%)`,
            accentColor: "#22c55e",
          }}
        />

        <div className="flex gap-2 mt-3">
          {PCT_SHORTCUTS.map((pct) => {
            const val = Math.max(1, Math.round(maxBet * pct / 100));
            const isActive = amount === val && !(pct !== 100 && val === maxBet);
            return (
              <button key={pct} onClick={() => setAmount(val)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isActive ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? "#4ade80" : "rgba(255,255,255,0.5)",
                }}>
                {pct}%
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2 text-right" style={{ color: "rgba(255,255,255,0.3)" }}>
          สูงสุด {maxBet.toLocaleString()} ญาณ
        </p>
      </div>

      {/* ── Payout ── */}
      {choiceIndex !== null && amount > 0 && (
        <div className="px-4 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>ถ้าทายถูก จะได้รับ</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Image src="/images/point2.png" alt="ญาณ" width={18} height={18} />
              <span className="text-2xl font-black text-white">~{potentialWin.toLocaleString()}</span>
            </div>
            <p className="text-sm font-bold" style={{ color: profitAmt > 0 ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
              {profitAmt > 0 ? `+${profitAmt.toLocaleString()} ญาณ (+${profitPct}%)` : "🌌 ตลาดกำลังก่อตัว"}
            </p>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <button
        onClick={handleVote}
        disabled={choiceIndex === null || isPending}
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: choiceIndex === null ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #16a34a, #22c55e)",
          boxShadow: choiceIndex !== null && !isPending ? "0 4px 24px rgba(34,197,94,0.35)" : "none",
        }}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> กำลังยืนยัน...
          </span>
        ) : choiceIndex === null ? "เลือกคำทายก่อน" : "ยืนยันการทาย"}
      </button>
    </div>
  );
}

// ── Social proof strip ─────────────────────────────────────────────
function SocialProof({ participantCount, yesPct, choiceIndex, yesLabel }: {
  participantCount: number;
  yesPct: number;
  choiceIndex: number | null;
  yesLabel: string;
}) {
  const count = Math.max(participantCount, 12);
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Avatars */}
      <div className="flex -space-x-2 flex-shrink-0">
        {AVATAR_SEEDS.slice(0, 4).map((seed, i) => (
          <div
            key={seed}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border"
            style={{
              background: AVATAR_COLORS[i],
              borderColor: "rgba(10,5,20,0.8)",
              color: "white",
              zIndex: 4 - i,
            }}
          >
            {seed}
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
          <span style={{ color: "#A78BFA" }}>{count.toLocaleString()} คน</span> เข้าร่วมทำนายแล้ว
        </p>
      </div>

      {/* Market heat indicators */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3" style={{ color: "#FB923C" }} />
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>HOT</span>
        </div>
        <div className="flex items-center gap-1">
          <Crown className="w-3 h-3" style={{ color: "#FBBF24" }} />
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>TOP</span>
        </div>
      </div>
    </div>
  );
}

// ── Multi-option pool bar ─────────────────────────────────────────
const OPTION_COLORS = [
  { bar: "linear-gradient(90deg,#16a34a,#22c55e)", text: "text-green-400" },
  { bar: "linear-gradient(90deg,#b91c1c,#ef4444)", text: "text-red-400" },
  { bar: "linear-gradient(90deg,#b45309,#f59e0b)", text: "text-yellow-400" },
  { bar: "linear-gradient(90deg,#6d28d9,#8b5cf6)", text: "text-purple-400" },
  { bar: "linear-gradient(90deg,#1d4ed8,#3b82f6)", text: "text-blue-400" },
];

function MultiPoolBar({ options, pools, live }: { options: string[]; pools: number[]; live?: boolean }) {
  const total = pools.reduce((s, v) => s + v, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex rounded-xl overflow-hidden" style={{ height: "10px" }}>
        {options.map((_, i) => {
          const pct = Math.round((pools[i] / total) * 100);
          return (
            <div
              key={i}
              className="transition-all duration-700"
              style={{ width: `${pct}%`, background: OPTION_COLORS[i % OPTION_COLORS.length].bar, minWidth: pct > 0 ? 4 : 0 }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {options.map((label, i) => {
          const pct = Math.round((pools[i] / total) * 100);
          return (
            <span key={i} className={`${OPTION_COLORS[i % OPTION_COLORS.length].text} font-semibold`}>
              {label} {pct}%
            </span>
          );
        })}
        {live && (
          <span className="flex items-center gap-1 text-[10px] ml-auto" style={{ color: "rgba(167,139,250,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
            LIVE
          </span>
        )}
      </div>
    </div>
  );
}
