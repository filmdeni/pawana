"use client";
import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Loader2, Lock, Flame, Zap, TrendingUp, Crown, Users } from "lucide-react";
import { clampPct } from "@/lib/poolDisplay";
import { castVoteAction } from "@/lib/actions/predictions";
import { useToast } from "@/components/Toast";
import { useRealtimeVotes } from "@/lib/hooks/useRealtimeVotes";
import InstantFeedback from "@/components/InstantFeedback";

interface VotePanelProps {
  predictionId: string;
  initialYesPool: number;
  initialNoPool: number;
  endsAt: string;
  userVote?: { choice: boolean; choice_index?: number | null; amount: number } | null;
  initialChoice?: boolean | null;
  onVoteSuccess?: () => void;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  optionPools?: number[] | null;
  userXp?: number;
  userLevel?: number;
}

const AMOUNTS = [100, 500, 1000, 2000, 5000];

type FloatItem = { id: number; text: string };

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
}: VotePanelProps) {
  const isMulti = options && options.length > 2;
  const resolvedOptions = isMulti ? options : [yesLabel, noLabel];

  const initialChoiceIndex = userVote?.choice_index ?? (initialChoice === true ? 0 : initialChoice === false ? 1 : null);
  const [choiceIndex, setChoiceIndex] = useState<number | null>(
    isMulti
      ? initialChoiceIndex
      : (userVote?.choice === true ? 0 : userVote?.choice === false ? 1 : initialChoice === true ? 0 : initialChoice === false ? 1 : null)
  );
  const [optionPools, setOptionPools] = useState<number[]>(
    isMulti
      ? (initialOptionPools ?? options!.map(() => 0))
      : [initialYesPool, initialNoPool]
  );
  const choice = choiceIndex === null ? null : choiceIndex === 0;
  const [amount, setAmount] = useState(500);
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState(!!userVote);
  const [showFeedback, setShowFeedback] = useState(false);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [flash, setFlash] = useState(false);
  const [popKey, setPopKey] = useState<boolean | null>(null);
  const floatCounter = useRef(0);
  const { success, error: toastError } = useToast();

  const { yesPool, noPool, participantCount } = useRealtimeVotes(predictionId, {
    yesPool: initialYesPool,
    noPool: initialNoPool,
    participantCount: 0,
  });

  const binaryYesPool = isMulti ? (optionPools[0] ?? 0) : yesPool;
  const binaryNoPool = isMulti ? (optionPools[1] ?? 0) : noPool;
  const total = (isMulti ? optionPools.reduce((s, v) => s + v, 0) : yesPool + noPool) || 1;
  const yesPct = Math.round((binaryYesPool / total) * 100);
  const noPct = 100 - yesPct;
  const isExpired = new Date(endsAt) < new Date();

  const potentialWin = choiceIndex !== null
    ? Math.floor(
        amount +
          (amount / ((optionPools[choiceIndex] ?? 0) + amount)) *
            (total - (optionPools[choiceIndex] ?? 0)) *
            0.95
      )
    : 0;

  const multiplier = amount > 0 && potentialWin > 0 ? (potentialWin / amount).toFixed(1) : "0";

  const spawnFloat = useCallback((text: string) => {
    const id = ++floatCounter.current;
    setFloats((f) => [...f, { id, text }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1500);
  }, []);

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
        setShowFeedback(true);
        onVoteSuccess?.();
      }
    });
  }

  if (isExpired) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="text-4xl">⌛</div>
        <p className="font-bold text-white text-lg">การทำนายสิ้นสุดแล้ว</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>รอประกาศผล</p>
        {isMulti
          ? <MultiPoolBar options={resolvedOptions!} pools={optionPools} />
          : <CinematicPoolBar yesPct={yesPct} noPct={noPct} yesPool={binaryYesPool} noPool={binaryNoPool} yesLabel={yesLabel} noLabel={noLabel} />}
      </div>
    );
  }

  if (voted) {
    const resolvedChoiceIndex = userVote?.choice_index ?? choiceIndex;
    const resolvedAmount = userVote?.amount ?? amount;
    const resolvedChoiceLabel = resolvedOptions?.[resolvedChoiceIndex ?? 0] ?? "—";
    const resolvedChoiceIsYes = (resolvedChoiceIndex ?? 0) === 0;

    if (showFeedback) {
      const myPool = optionPools[resolvedChoiceIndex ?? 0] ?? 0;
      const agreePct = total > 0 ? Math.round((myPool / total) * 100) : 0;
      return (
        <div className="space-y-3">
          <InstantFeedback
            choiceLabel={resolvedChoiceLabel}
            choiceIsYes={resolvedChoiceIsYes}
            agreePct={agreePct}
            xpGained={XP_PER_VOTE}
            currentXp={userXp}
            xpPerLevel={Math.max(1, userLevel * 208)}
            level={userLevel}
            onDone={() => setShowFeedback(false)}
          />
        </div>
      );
    }

    return (
      <VotedState
        choiceIndex={resolvedChoiceIndex ?? 0}
        choiceLabel={resolvedChoiceLabel}
        amount={resolvedAmount}
        endsAt={endsAt}
        yesPool={binaryYesPool}
        noPool={binaryNoPool}
        yesPct={yesPct}
        noPct={noPct}
        participantCount={participantCount}
        yesLabel={yesLabel}
        noLabel={noLabel}
        options={isMulti ? resolvedOptions : null}
        optionPools={isMulti ? optionPools : null}
      />
    );
  }

  // ── Cinematic voting form ──────────────────────────────────────
  return (
    <div className="space-y-5 relative">
      {/* Flash overlay */}
      {flash && (
        <div
          className="absolute inset-0 rounded-2xl z-20 success-flash-overlay pointer-events-none"
          style={{ background: choice ? "rgba(94,211,166,0.25)" : "rgba(217,107,107,0.25)" }}
        />
      )}

      {/* Floating coin popups */}
      {floats.map((f) => (
        <div
          key={f.id}
          className="absolute left-1/2 -translate-x-1/2 z-30 xp-float-item text-sm font-black"
          style={{ color: "#D7B56D", bottom: "60px", textShadow: "0 0 12px rgba(215,181,109,0.8)" }}
        >
          {f.text}
        </div>
      ))}

      {/* ── Sentiment bar ── */}
      {isMulti
        ? <MultiPoolBar options={resolvedOptions!} pools={optionPools} live />
        : <CinematicPoolBar yesPct={yesPct} noPct={noPct} yesPool={binaryYesPool} noPool={binaryNoPool} live yesLabel={yesLabel} noLabel={noLabel} />}

      {/* ── Social proof strip ── */}
      <SocialProof participantCount={participantCount} yesPct={yesPct} choiceIndex={choiceIndex} yesLabel={yesLabel} />

      {/* ── Choice cards ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          เลือกฝั่งที่คุณเชื่อ
        </p>
        {isMulti ? (
          <div className="grid grid-cols-2 gap-2.5">
            {resolvedOptions!.map((label, idx) => {
              const selected = choiceIndex === idx;
              const optPool = optionPools[idx] ?? 0;
              const pct = total > 0 ? Math.round((optPool / total) * 100) : 0;
              const colors = [
                { glow: "rgba(94,211,166,0.5)", border: "rgba(94,211,166,0.6)", bg: "rgba(94,211,166,0.08)", text: "#5ED3A6", hoverBg: "rgba(94,211,166,0.14)" },
                { glow: "rgba(239,68,68,0.5)", border: "rgba(239,68,68,0.6)", bg: "rgba(239,68,68,0.08)", text: "#F87171", hoverBg: "rgba(239,68,68,0.14)" },
                { glow: "rgba(251,191,36,0.5)", border: "rgba(251,191,36,0.6)", bg: "rgba(251,191,36,0.08)", text: "#FBbF24", hoverBg: "rgba(251,191,36,0.14)" },
                { glow: "rgba(139,92,246,0.5)", border: "rgba(139,92,246,0.6)", bg: "rgba(139,92,246,0.08)", text: "#A78BFA", hoverBg: "rgba(139,92,246,0.14)" },
                { glow: "rgba(59,130,246,0.5)", border: "rgba(59,130,246,0.6)", bg: "rgba(59,130,246,0.08)", text: "#60A5FA", hoverBg: "rgba(59,130,246,0.14)" },
              ];
              const c = colors[idx % colors.length];
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(idx)}
                  className={`relative rounded-2xl py-4 px-3 text-left overflow-hidden transition-all duration-200 ${selected ? "btn-pop-once" : "hover:scale-[1.02]"}`}
                  style={{
                    background: selected ? c.bg : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selected ? c.border : "rgba(255,255,255,0.08)"}`,
                    boxShadow: selected ? `0 0 24px ${c.glow}, 0 0 0 1px ${c.border}` : "none",
                  }}
                >
                  {selected && (
                    <span
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${c.bg} 0%, transparent 70%)` }}
                    />
                  )}
                  <span className="block font-black text-sm truncate" style={{ color: selected ? c.text : "rgba(255,255,255,0.85)" }}>{label}</span>
                  <span className="block text-[11px] mt-1 font-semibold" style={{ color: selected ? c.text : "rgba(255,255,255,0.35)" }}>
                    {pct}% · {optPool.toLocaleString()} ญาณ
                  </span>
                  {selected && (
                    <span className="block text-[10px] font-bold mt-1.5" style={{ color: c.text }}>
                      ✓ เลือกแล้ว
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* YES card */}
            <button
              onClick={() => handleChoiceSelect(0)}
              key={popKey === true ? "yes-pop" : "yes"}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 group ${choiceIndex === 0 ? "btn-pop-once" : "hover:scale-[1.03]"}`}
              style={{
                background: choiceIndex === 0
                  ? "linear-gradient(145deg, rgba(20,80,55,0.9), rgba(10,50,35,0.95))"
                  : "linear-gradient(145deg, rgba(94,211,166,0.06), rgba(94,211,166,0.02))",
                border: `1.5px solid ${choiceIndex === 0 ? "rgba(94,211,166,0.7)" : "rgba(94,211,166,0.2)"}`,
                boxShadow: choiceIndex === 0
                  ? "0 0 32px rgba(94,211,166,0.35), 0 0 0 1px rgba(94,211,166,0.5), inset 0 1px 0 rgba(94,211,166,0.2)"
                  : "0 0 16px rgba(94,211,166,0.05)",
                minHeight: "110px",
              }}
            >
              {/* Ambient glow top */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(94,211,166,0.6), transparent)" }} />
              {choiceIndex === 0 && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(94,211,166,0.18) 0%, transparent 65%)" }} />
              )}

              <div className="relative p-4 flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black transition-all duration-200"
                  style={{
                    background: choiceIndex === 0 ? "rgba(94,211,166,0.25)" : "rgba(94,211,166,0.08)",
                    boxShadow: choiceIndex === 0 ? "0 0 20px rgba(94,211,166,0.4)" : "none",
                    color: "#5ED3A6",
                  }}
                >
                  ✓
                </div>
                <span className="font-black text-lg leading-tight" style={{ color: choiceIndex === 0 ? "#5ED3A6" : "rgba(94,211,166,0.8)" }}>
                  {yesLabel}
                </span>
                {choiceIndex === 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(94,211,166,0.2)", color: "#5ED3A6" }}>
                    เลือกแล้ว ✓
                  </span>
                )}
              </div>
            </button>

            {/* NO card */}
            <button
              onClick={() => handleChoiceSelect(1)}
              key={popKey === false ? "no-pop" : "no"}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 group ${choiceIndex === 1 ? "btn-pop-once" : "hover:scale-[1.03]"}`}
              style={{
                background: choiceIndex === 1
                  ? "linear-gradient(145deg, rgba(80,15,15,0.9), rgba(55,8,8,0.95))"
                  : "linear-gradient(145deg, rgba(217,107,107,0.06), rgba(217,107,107,0.02))",
                border: `1.5px solid ${choiceIndex === 1 ? "rgba(239,68,68,0.7)" : "rgba(217,107,107,0.2)"}`,
                boxShadow: choiceIndex === 1
                  ? "0 0 32px rgba(239,68,68,0.35), 0 0 0 1px rgba(239,68,68,0.5), inset 0 1px 0 rgba(239,68,68,0.2)"
                  : "0 0 16px rgba(217,107,107,0.05)",
                minHeight: "110px",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)" }} />
              {choiceIndex === 1 && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(239,68,68,0.18) 0%, transparent 65%)" }} />
              )}

              <div className="relative p-4 flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black transition-all duration-200"
                  style={{
                    background: choiceIndex === 1 ? "rgba(239,68,68,0.25)" : "rgba(217,107,107,0.08)",
                    boxShadow: choiceIndex === 1 ? "0 0 20px rgba(239,68,68,0.4)" : "none",
                    color: "#F87171",
                  }}
                >
                  ✗
                </div>
                <span className="font-black text-lg leading-tight" style={{ color: choiceIndex === 1 ? "#F87171" : "rgba(217,107,107,0.8)" }}>
                  {noLabel}
                </span>
                {choiceIndex === 1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.2)", color: "#F87171" }}>
                    เลือกแล้ว ✓
                  </span>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Amount section ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          จำนวนญาณ
        </p>
        <div className="flex gap-2 mb-3">
          {AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all duration-150 active:scale-95"
              style={{
                background: amount === v
                  ? "linear-gradient(135deg, rgba(111,75,255,0.4), rgba(139,92,246,0.3))"
                  : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${amount === v ? "rgba(139,92,246,0.7)" : "rgba(255,255,255,0.07)"}`,
                color: amount === v ? "#C4B5FD" : "rgba(255,255,255,0.45)",
                boxShadow: amount === v ? "0 0 16px rgba(111,75,255,0.25)" : "none",
              }}
            >
              {v >= 1000 ? `${v / 1000}K` : v}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(111,75,255,0.25)",
          }}
        >
          <Image src="/images/point2.png" alt="coin" width={20} height={20} className="flex-shrink-0" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
            min={10}
            className="flex-1 bg-transparent text-white font-black text-lg focus:outline-none min-w-0"
            style={{ caretColor: "#A78BFA" }}
          />
          <span className="text-sm font-semibold flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>ญาณ</span>
        </div>
      </div>

      {/* ── Reward section ── */}
      {choiceIndex !== null && amount > 0 && (
        <div
          className="rounded-2xl overflow-hidden relative fade-in"
          style={{
            background: "linear-gradient(135deg, rgba(15,5,35,0.95), rgba(25,10,55,0.95))",
            border: "1px solid rgba(215,181,109,0.25)",
            boxShadow: "0 0 40px rgba(111,75,255,0.1), inset 0 1px 0 rgba(215,181,109,0.1)",
          }}
        >
          {/* Top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,181,109,0.5), transparent)" }} />

          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  ถ้าคุณทายถูก คุณจะได้รับ ✨
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
                    {potentialWin.toLocaleString()}
                  </span>
                  <span className="text-base font-bold" style={{ color: "rgba(255,215,0,0.7)" }}>ญาณ</span>
                </div>
              </div>

              {/* Multiplier badge */}
              <div
                className="flex flex-col items-center justify-center rounded-xl px-3 py-2 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(111,75,255,0.3), rgba(139,92,246,0.2))",
                  border: "1px solid rgba(139,92,246,0.4)",
                }}
              >
                <span className="text-xl font-black" style={{ color: "#A78BFA" }}>{multiplier}x</span>
                <span className="text-[9px] font-semibold" style={{ color: "rgba(167,139,250,0.6)" }}>PROFIT</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>
                  +{(potentialWin - amount).toLocaleString()} กำไรสุทธิ
                </span>
              </div>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>หัก 5% ค่าดำเนินการ</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA button ── */}
      <button
        onClick={handleVote}
        disabled={choiceIndex === null || isPending}
        className="w-full relative overflow-hidden rounded-2xl font-black text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          padding: "16px 24px",
          background: choiceIndex === null
            ? "rgba(111,75,255,0.2)"
            : "linear-gradient(135deg, #4B3090, #6F4BFF, #8B5CF6)",
          boxShadow: choiceIndex !== null && !isPending
            ? "0 0 40px rgba(111,75,255,0.5), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "none",
          fontSize: "1rem",
        }}
      >
        {/* Animated shimmer on active */}
        {choiceIndex !== null && !isPending && (
          <span className="absolute inset-0 cta-shimmer pointer-events-none" />
        )}
        {/* Top edge highlight */}
        {choiceIndex !== null && (
          <span className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />
        )}

        <span className="relative flex items-center justify-center gap-2.5">
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังล็อกคำทำนาย...
            </>
          ) : choiceIndex !== null ? (
            <>
              <Lock className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
              ล็อกคำทำนาย · {resolvedOptions![choiceIndex]} {amount.toLocaleString()} ญาณ
            </>
          ) : (
            "เลือกฝั่งก่อน"
          )}
        </span>
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

// ── Cinematic pool bar (binary) ────────────────────────────────────
function CinematicPoolBar({
  yesPct, noPct, yesPool, noPool, live, yesLabel = "ใช่", noLabel = "ไม่ใช่",
}: {
  yesPct: number; noPct: number; yesPool: number; noPool: number;
  live?: boolean; yesLabel?: string; noLabel?: string;
}) {
  const { yes: yesW, no: noW } = clampPct(yesPct);
  const dominant = yesW >= noW ? "yes" : "no";

  return (
    <div className="space-y-3">
      {/* Percentage row */}
      <div className="flex items-end justify-between">
        <div className="text-left">
          <div className="text-4xl font-black leading-none tabular-nums" style={{ color: "#5ED3A6", textShadow: "0 0 24px rgba(94,211,166,0.5)" }}>
            {yesW}%
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: "#5ED3A6" }}>{yesLabel}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          {live && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400">LIVE</span>
            </div>
          )}
          <TrendingUp className="w-4 h-4" style={{ color: dominant === "yes" ? "#5ED3A6" : "#F87171" }} />
        </div>

        <div className="text-right">
          <div className="text-4xl font-black leading-none tabular-nums" style={{ color: "#F87171", textShadow: "0 0 24px rgba(239,68,68,0.5)" }}>
            {noW}%
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: "#F87171" }}>{noLabel}</div>
        </div>
      </div>

      {/* Bar */}
      <div className="relative rounded-full overflow-hidden" style={{ height: "10px", background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${yesW}%`,
            background: "linear-gradient(90deg, #16a34a, #22c55e, #5ED3A6)",
            boxShadow: "4px 0 16px rgba(94,211,166,0.6)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 transition-all duration-700"
          style={{
            width: `${noW}%`,
            background: "linear-gradient(270deg, #7f1d1d, #dc2626, #F87171)",
            boxShadow: "-4px 0 16px rgba(239,68,68,0.6)",
          }}
        />
      </div>

      {/* Pool amounts */}
      <div className="flex justify-between text-xs font-semibold">
        <span style={{ color: "rgba(94,211,166,0.7)" }}>{yesPool.toLocaleString()} ญาณ</span>
        <span style={{ color: "rgba(239,68,68,0.7)" }}>{noPool.toLocaleString()} ญาณ</span>
      </div>
    </div>
  );
}

// ── Voted state ─────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt, timeLeft]);
  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const mins = Math.floor((timeLeft % 3600000) / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  return { days, hours, mins, secs, expired: timeLeft <= 0 };
}

function VotedState({
  choiceIndex, choiceLabel, amount, endsAt, yesPool, noPool, yesPct, noPct, participantCount, yesLabel, noLabel, options, optionPools,
}: {
  choiceIndex: number; choiceLabel: string; amount: number; endsAt: string;
  yesPool: number; noPool: number; yesPct: number; noPct: number;
  participantCount: number; yesLabel: string; noLabel: string;
  options: string[] | null; optionPools: number[] | null;
}) {
  const { days, hours, mins, secs, expired } = useCountdown(endsAt);
  const isMulti = options && options.length > 2;
  const choiceIsYes = choiceIndex === 0;
  const myPool = isMulti ? (optionPools?.[choiceIndex] ?? 0) : (choiceIsYes ? yesPool : noPool);
  const totalPool = isMulti ? (optionPools?.reduce((s, v) => s + v, 0) ?? 0) : (yesPool + noPool);
  const oppPool = totalPool - myPool;
  const potentialWin = myPool > 0 ? Math.floor(amount + (amount / myPool) * oppPool * 0.95) : amount;
  const multiplier = amount > 0 ? (potentialWin / amount).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      {/* Locked badge */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          background: choiceIsYes
            ? "linear-gradient(135deg, rgba(20,80,55,0.6), rgba(10,40,30,0.8))"
            : "linear-gradient(135deg, rgba(80,15,15,0.6), rgba(45,8,8,0.8))",
          border: `1.5px solid ${choiceIsYes ? "rgba(94,211,166,0.4)" : "rgba(239,68,68,0.4)"}`,
          boxShadow: choiceIsYes ? "0 0 24px rgba(94,211,166,0.15)" : "0 0 24px rgba(239,68,68,0.15)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: choiceIsYes ? "rgba(94,211,166,0.2)" : "rgba(239,68,68,0.2)",
            boxShadow: choiceIsYes ? "0 0 16px rgba(94,211,166,0.3)" : "0 0 16px rgba(239,68,68,0.3)",
          }}
        >
          <Lock className="w-5 h-5" style={{ color: choiceIsYes ? "#5ED3A6" : "#F87171" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>คำทำนายของคุณ</p>
          <p className="font-black text-lg" style={{ color: choiceIsYes ? "#5ED3A6" : "#F87171" }}>
            {choiceIsYes ? "✓" : "✗"} {choiceLabel}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {amount.toLocaleString()} ญาณ ถูกล็อกแล้ว
          </p>
        </div>
      </div>

      {/* Payout */}
      {!expired && (
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15,5,35,0.95), rgba(25,10,55,0.95))",
            border: "1px solid rgba(215,181,109,0.25)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(215,181,109,0.5), transparent)" }} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>ถ้าถูกต้อง คาดว่าได้รับ</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black" style={{ color: "#FFD700" }}>{potentialWin.toLocaleString()}</span>
                <span className="text-sm font-bold" style={{ color: "rgba(255,215,0,0.6)" }}>ญาณ</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#22C55E" }}>
                +{(potentialWin - amount).toLocaleString()} กำไรสุทธิ
              </p>
            </div>
            <div
              className="rounded-xl px-3 py-2 text-center"
              style={{ background: "rgba(111,75,255,0.2)", border: "1px solid rgba(139,92,246,0.35)" }}
            >
              <span className="text-xl font-black" style={{ color: "#A78BFA" }}>{multiplier}x</span>
              <p className="text-[9px] font-bold" style={{ color: "rgba(167,139,250,0.5)" }}>PROFIT</p>
            </div>
          </div>
        </div>
      )}

      {/* Countdown */}
      <div
        className="rounded-2xl px-4 py-3 text-center"
        style={{ background: "rgba(111,75,255,0.07)", border: "1px solid rgba(111,75,255,0.2)" }}
      >
        {expired ? (
          <>
            <p className="text-xs text-purple-400 mb-1">หมดเวลาแล้ว</p>
            <p className="text-sm font-bold text-white">รอประกาศผล...</p>
          </>
        ) : (
          <>
            <p className="text-xs mb-2" style={{ color: "rgba(167,139,250,0.7)" }}>ผลจะออกใน</p>
            <div className="flex justify-center gap-3">
              {days > 0 && <CountUnit value={days} label="วัน" />}
              <CountUnit value={hours} label="ชม." />
              <CountUnit value={mins} label="นาที" />
              {days === 0 && <CountUnit value={secs} label="วินาที" />}
            </div>
          </>
        )}
      </div>

      {isMulti && options && optionPools
        ? <MultiPoolBar options={options} pools={optionPools} live />
        : <CinematicPoolBar yesPct={yesPct} noPct={noPct} yesPool={yesPool} noPool={noPool} live yesLabel={yesLabel} noLabel={noLabel} />}

      <p className="text-center text-xs" style={{ color: "rgba(139,92,246,0.6)" }}>
        ผู้เข้าร่วม {participantCount.toLocaleString()} คน · อัปเดต real-time
      </p>
    </div>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black tabular-nums" style={{ color: "#A78BFA", minWidth: "2.5ch", textAlign: "center" }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
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
