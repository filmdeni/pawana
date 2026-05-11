"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { claimMissionAction } from "@/lib/actions/missions";
import { triggerCoinFly } from "@/components/CoinFly";

interface Mission {
  label: string;
  progress: number;
  total: number;
  reward: number;
  done?: boolean;
  icon?: string;
  slug?: string | null;
}

export default function MissionCard({ m }: { m: Mission }) {
  const pct = Math.min((m.progress / m.total) * 100, 100);
  const isComplete = m.progress >= m.total;
  const [claimed, setClaimed] = useState(!!m.done);
  const [burst, setBurst] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClaim(e: React.MouseEvent<HTMLButtonElement>) {
    if (claimed || isPending) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 800);
    setClaimed(true);
    triggerCoinFly(e.currentTarget, 8);
    if (m.slug) startTransition(async () => { await claimMissionAction(m.slug!); });
  }

  return (
    <div
      className={`glass rounded-xl p-3.5 flex items-center gap-3.5 relative overflow-hidden transition-all duration-200
        ${claimed ? "opacity-60" : isComplete ? "card-hover border border-yellow-400/30" : "card-hover"}`}
      style={claimed ? { borderColor: "rgba(94,211,166,0.25)" } : undefined}
    >
      {/* Burst particles */}
      {burst && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          {["🪙","✨","⭐","🌟","💫"].map((e, i) => (
            <span
              key={i}
              className="absolute text-lg animate-ping"
              style={{
                animationDuration: `${0.4 + i * 0.08}s`,
                animationIterationCount: 1,
                transform: `translate(${Math.cos((i / 5) * Math.PI * 2) * 40}px, ${Math.sin((i / 5) * Math.PI * 2) * 40}px)`,
                opacity: 0,
              }}
            >
              {e}
            </span>
          ))}
          <span className="absolute inset-0 rounded-xl bg-yellow-400/10 animate-ping" style={{ animationDuration: "0.4s", animationIterationCount: 1 }} />
        </div>
      )}

      {claimed && <div className="absolute inset-0 bg-[#5ED3A6]/[0.04] pointer-events-none" />}

      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl relative z-10"
        style={{
          background: claimed ? "rgba(94,211,166,0.10)" : isComplete ? "rgba(215,181,109,0.15)" : "rgba(111,75,255,0.12)",
          border: `1px solid ${claimed ? "rgba(94,211,166,0.30)" : isComplete ? "rgba(215,181,109,0.40)" : "rgba(111,75,255,0.25)"}`,
        }}
      >
        {claimed ? "✅" : (m.icon ?? "🎯")}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 relative z-10">
        <p className={`text-sm font-semibold leading-snug truncate ${claimed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
          {m.label}
        </p>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: claimed
                ? "linear-gradient(90deg, #3aaa82, #5ED3A6)"
                : isComplete
                ? "linear-gradient(90deg, #D7B56D, #f4c24a)"
                : "linear-gradient(90deg, #4B3975, #6F4BFF, #7B61FF)",
            }}
          />
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {claimed ? "สำเร็จแล้ว" : `${m.progress} / ${m.total}`}
        </p>
      </div>

      {/* Reward / Claim button */}
      {claimed ? (
        <div
          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl relative z-10"
          style={{ background: "rgba(94,211,166,0.08)", border: "1px solid rgba(94,211,166,0.25)" }}
        >
          <CheckCircle2 className="w-4 h-4 text-[#5ED3A6]" />
          <span className="text-[10px] font-black text-[#5ED3A6]">รับแล้ว</span>
        </div>
      ) : isComplete ? (
        <button
          onClick={(e) => handleClaim(e)}
          disabled={isPending}
          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative z-10 transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(215,181,109,0.25), rgba(244,194,74,0.15))",
            border: "1px solid rgba(215,181,109,0.50)",
            boxShadow: "0 0 14px rgba(215,181,109,0.20)",
          }}
        >
          {isPending
            ? <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            : <Image src="/images/point2.png" alt="point" width={18} height={18} />}
          <span className="text-[10px] font-black text-yellow-400">
            {isPending ? "..." : `+${m.reward}`}
          </span>
        </button>
      ) : (
        <div
          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl relative z-10"
          style={{ background: "rgba(215,181,109,0.08)", border: "1px solid rgba(215,181,109,0.22)" }}
        >
          <Image src="/images/point2.png" alt="point" width={18} height={18} className="coin-bounce inline-block" />
          <span className="text-[10px] font-black text-[#D7B56D]">+{m.reward}</span>
        </div>
      )}
    </div>
  );
}
