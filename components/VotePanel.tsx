"use client";
import { useState, useTransition, useRef, useCallback } from "react";
import { Loader2, Coins, CheckCircle2 } from "lucide-react";
import { clampPct } from "@/lib/poolDisplay";
import { castVoteAction } from "@/lib/actions/predictions";
import { useToast } from "@/components/Toast";
import { useRealtimeVotes } from "@/lib/hooks/useRealtimeVotes";

interface VotePanelProps {
  predictionId: string;
  initialYesPool: number;
  initialNoPool: number;
  endsAt: string;
  userVote?: { choice: boolean; amount: number } | null;
  initialChoice?: boolean | null;
  onVoteSuccess?: () => void;
  yesLabel?: string;
  noLabel?: string;
}

const AMOUNTS = [100, 500, 1000, 2000, 5000];

type FloatItem = { id: number; text: string };

// ── Subtle Web-Audio sounds ──────────────────────────────────────
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
    const notes = [523, 659, 784]; // C5 E5 G5
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
}: VotePanelProps) {
  const [choice, setChoice] = useState<boolean | null>(userVote?.choice ?? initialChoice ?? null);
  const [amount, setAmount] = useState(500);
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState(!!userVote);
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

  const total = yesPool + noPool || 1;
  const yesPct = Math.round((yesPool / total) * 100);
  const noPct = 100 - yesPct;
  const isExpired = new Date(endsAt) < new Date();

  const potentialWin =
    choice !== null
      ? Math.floor(
          amount +
            (amount / (choice ? yesPool + amount : noPool + amount)) *
              (choice ? noPool : yesPool) *
              0.95
        )
      : 0;

  const spawnFloat = useCallback((text: string) => {
    const id = ++floatCounter.current;
    setFloats((f) => [...f, { id, text }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1500);
  }, []);

  function handleChoiceSelect(c: boolean) {
    setChoice(c);
    setPopKey(c);
    playSelect(c);
    setTimeout(() => setPopKey(null), 300);
  }

  function handleVote() {
    if (choice === null) return;
    startTransition(async () => {
      const result = await castVoteAction(predictionId, choice, amount);
      if ("error" in result) {
        toastError("ทำนายไม่สำเร็จ", result.error);
      } else {
        playSuccess();
        setFlash(true);
        spawnFloat(`+${amount.toLocaleString()} พาราฯ`);
        setTimeout(() => setFlash(false), 700);
        setVoted(true);
        success("ทำนายสำเร็จ! 🔮", `วางเดิมพัน ${amount.toLocaleString()} พาราฯ`);
        onVoteSuccess?.();
      }
    });
  }

  // ── Expired state ─────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-3xl">⌛</p>
        <p className="font-bold text-[var(--text-primary)]">การทำนายสิ้นสุดแล้ว</p>
        <p className="text-sm text-[var(--text-muted)]">รอประกาศผล</p>
        <PoolBar yesPct={yesPct} noPct={noPct} yesPool={yesPool} noPool={noPool} yesLabel={yesLabel} noLabel={noLabel} />
      </div>
    );
  }

  // ── Already voted state ────────────────────────────────────────
  if (voted) {
    return (
      <div className="space-y-4">
        <div className="text-center py-2 space-y-2">
          <CheckCircle2 className="w-9 h-9 text-green-400 mx-auto" />
          <p className="font-bold text-[var(--text-primary)]">คุณได้ทำนายแล้ว</p>
          <div className="glass rounded-xl px-4 py-3 inline-block">
            <p className="text-xs text-[var(--text-muted)]">คุณเลือก</p>
            <p className={`text-lg font-black ${
              userVote != null ? (userVote.choice ? "text-green-400" : "text-red-400")
              : choice === true ? "text-green-400" : choice === false ? "text-red-400" : "text-[var(--text-muted)]"
            }`}>
              {(userVote?.choice ?? choice) === true ? `✓ ${yesLabel}` : (userVote?.choice ?? choice) === false ? `✗ ${noLabel}` : "—"}
            </p>
            <p className="text-xs text-yellow-400">{(userVote?.amount ?? amount).toLocaleString()} พาราฯ</p>
          </div>
        </div>
        <PoolBar yesPct={yesPct} noPct={noPct} yesPool={yesPool} noPool={noPool} live yesLabel={yesLabel} noLabel={noLabel} />
        <p className="text-center text-xs text-purple-500">
          ผู้เข้าร่วม {(participantCount).toLocaleString()} คน · อัปเดต real-time
        </p>
      </div>
    );
  }

  // ── Voting form ────────────────────────────────────────────────
  return (
    <div className="space-y-4 relative">
      {/* Flash overlay on success */}
      {flash && (
        <div
          className="absolute inset-0 rounded-2xl z-20 success-flash-overlay"
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

      {/* Live pool bar */}
      <PoolBar yesPct={yesPct} noPct={noPct} yesPool={yesPool} noPool={noPool} live yesLabel={yesLabel} noLabel={noLabel} />

      {/* Choice */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">เลือกฝั่งที่คุณเชื่อ</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChoiceSelect(true)}
            key={popKey === true ? "yes-pop" : "yes"}
            className={`btn-yes rounded-xl py-4 font-black text-base relative overflow-hidden ${choice === true ? "selected btn-pop-once" : ""}`}
            style={choice === true ? {
              background: "rgba(94,211,166,0.22)",
              borderColor: "rgba(94,211,166,0.70)",
            } : undefined}
          >
            {choice === true && (
              <span className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
            )}
            <span className="text-lg mr-1">✓</span> {yesLabel}
            {choice === true && <span className="block text-[10px] opacity-70 font-normal mt-0.5">เลือกแล้ว</span>}
          </button>
          <button
            onClick={() => handleChoiceSelect(false)}
            key={popKey === false ? "no-pop" : "no"}
            className={`btn-no rounded-xl py-4 font-black text-base relative overflow-hidden ${choice === false ? "selected btn-pop-once" : ""}`}
            style={choice === false ? {
              background: "rgba(217,107,107,0.22)",
              borderColor: "rgba(217,107,107,0.70)",
            } : undefined}
          >
            {choice === false && (
              <span className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
            )}
            <span className="text-lg mr-1">✗</span> {noLabel}
            {choice === false && <span className="block text-[10px] opacity-70 font-normal mt-0.5">เลือกแล้ว</span>}
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">จำนวนพาราฯ</p>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`chip flex-1 min-w-12 py-1.5 text-center ${amount === v ? "active" : ""}`}
            >
              {v >= 1000 ? `${v / 1000}K` : v}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
          min={10}
          className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60 transition-all"
        />
      </div>

      {/* Payout estimate */}
      {choice !== null && amount > 0 && (
        <div
          className="rounded-xl px-4 py-3 fade-in"
          style={{
            background: "rgba(215,181,109,0.07)",
            border: "1px solid rgba(215,181,109,0.20)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">ถ้าถูกต้อง คาดว่าได้รับ</span>
            <span className="font-black text-sm flex items-center gap-1.5" style={{ color: "#D7B56D" }}>
              <Coins className="w-3.5 h-3.5" />
              ~{potentialWin.toLocaleString()}
              <span className="font-normal text-xs opacity-70">พาราฯ</span>
            </span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
            กำไรสุทธิ ~{(potentialWin - amount).toLocaleString()} พาราฯ · หัก 5% ค่าดำเนินการ
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleVote}
        disabled={choice === null || isPending}
        className="w-full py-3.5 rounded-xl font-black text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 relative overflow-hidden active:scale-95"
        style={{
          background: choice === null
            ? "rgba(111,75,255,0.25)"
            : "linear-gradient(135deg, #4B3975, #6F4BFF, #7B61FF)",
          boxShadow: choice !== null && !isPending ? "0 0 28px rgba(111,75,255,0.35)" : undefined,
          transition: "transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease",
        }}
      >
        {choice !== null && !isPending && (
          <span className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
        )}
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผล...
          </>
        ) : choice !== null ? (
          `ยืนยัน · ${choice ? yesLabel : noLabel} ${amount.toLocaleString()} พาราฯ`
        ) : (
          "เลือกฝั่งก่อน"
        )}
      </button>
    </div>
  );
}

// ── Shared sub-component ──────────────────────────────────────────
function PoolBar({
  yesPct,
  noPct,
  yesPool,
  noPool,
  live,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
}: {
  yesPct: number;
  noPct: number;
  yesPool: number;
  noPool: number;
  live?: boolean;
  yesLabel?: string;
  noLabel?: string;
}) {
  const { yes: yesW, no: noW } = clampPct(yesPct);
  return (
    <div>
      <div className="flex rounded-xl overflow-hidden h-8 mb-1.5">
        <div
          className="progress-yes flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
          style={{ width: `${yesW}%` }}
        >
          {yesLabel} {yesW}%
        </div>
        <div
          className="progress-no flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
          style={{ width: `${noW}%` }}
        >
          {noLabel} {noW}%
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-green-400 font-semibold">{yesPool.toLocaleString()} พาราฯ</span>
        {live && (
          <span className="text-purple-500 flex items-center gap-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
            LIVE
          </span>
        )}
        <span className="text-red-400 font-semibold">{noPool.toLocaleString()} พาราฯ</span>
      </div>
    </div>
  );
}
