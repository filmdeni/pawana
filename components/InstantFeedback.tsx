"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
    if (level >= TIER_THRESHOLDS[i].minLevel) {
      current = TIER_THRESHOLDS[i];
      next = TIER_THRESHOLDS[i + 1] ?? null;
    }
  }
  return { current, next };
}

interface InstantFeedbackProps {
  choiceLabel: string;
  choiceIsYes: boolean;
  agreePct: number;
  xpGained: number;
  currentXp: number;
  xpPerLevel: number;
  level: number;
  onDone: () => void;
}

export default function InstantFeedback({
  choiceLabel,
  choiceIsYes,
  agreePct,
  xpGained,
  currentXp,
  xpPerLevel,
  level,
  onDone,
}: InstantFeedbackProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const [xpFilled, setXpFilled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { current: tier, next: nextTier } = getTierInfo(level);
  const xpAfter = currentXp + xpGained;
  const xpToNextLevel = xpPerLevel - (xpAfter % xpPerLevel);
  const barBefore = ((currentXp % xpPerLevel) / xpPerLevel) * 100;
  const barAfter = Math.min(((xpAfter % xpPerLevel) / xpPerLevel) * 100, 100);

  useEffect(() => {
    const t1 = setTimeout(() => { setPhase("visible"); setXpFilled(true); }, 120);
    // ไม่ auto-dismiss — ผู้ใช้ต้องกดปิดเอง
    return () => { clearTimeout(t1); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDone]);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("exit");
    setTimeout(onDone, 380);
  }

  const color = choiceIsYes ? "#5ED3A6" : "#D96B6B";
  const bg    = choiceIsYes ? "rgba(94,211,166,0.10)" : "rgba(217,107,107,0.10)";
  const border= choiceIsYes ? "rgba(94,211,166,0.35)" : "rgba(217,107,107,0.35)";

  return (
    <div
      className="instant-feedback-wrap"
      data-phase={phase}
      onClick={dismiss}
    >
      <div className="instant-feedback-card" onClick={(e) => e.stopPropagation()}>

        {/* ✨ Choice row */}
        <div className="instant-feedback-choice" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="instant-feedback-sparkle">✨</span>
          <span className="instant-feedback-choice-text" style={{ color }}>
            คุณเลือก <strong>{choiceLabel}</strong>
          </span>
        </div>

        {/* % agree */}
        <div className="instant-feedback-agree">
          <div className="instant-feedback-agree-bar-bg">
            <div
              className="instant-feedback-agree-bar-fill"
              style={{ width: xpFilled ? `${agreePct}%` : "0%", background: color }}
            />
          </div>
          <p className="instant-feedback-agree-label">
            <span style={{ color, fontWeight: 800 }}>{agreePct}%</span>
            {" "}ของผู้ทายคิดเหมือนคุณ
          </p>
        </div>

        {/* XP gained */}
        <div className="instant-feedback-xp-row">
          <span className="instant-feedback-xp-badge">
            ⚡ <span className="instant-feedback-xp-value">+{xpGained} XP</span>
          </span>
        </div>

        {/* XP bar progress */}
        <div className="instant-feedback-bar-wrap">
          <div className="instant-feedback-bar-track">
            <div
              className="instant-feedback-bar-old"
              style={{ width: `${barBefore}%`, background: tier.color }}
            />
            <div
              className="instant-feedback-bar-gain"
              style={{
                left: `${barBefore}%`,
                width: xpFilled ? `${Math.max(0, barAfter - barBefore)}%` : "0%",
                background: `${tier.color}`,
                boxShadow: `0 0 8px ${tier.color}80`,
              }}
            />
          </div>
          <div className="instant-feedback-bar-labels">
            <span style={{ color: tier.color, fontWeight: 700, fontSize: "0.72rem" }}>
              Lv.{level} · {tier.label}
            </span>
            {nextTier ? (
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                อีก <strong style={{ color: tier.color }}>{xpToNextLevel.toLocaleString()} XP</strong> เลื่อนเป็น{" "}
                <span style={{ color: nextTier.color }}>{nextTier.label}</span>
              </span>
            ) : (
              <span style={{ color: tier.color, fontSize: "0.7rem", fontWeight: 700 }}>ระดับสูงสุดแล้ว</span>
            )}
          </div>
        </div>

        {/* Coins row */}
        <div className="instant-feedback-coins-row">
          <Image src="/images/point2.png" alt="coin" width={14} height={14} />
          <span className="instant-feedback-coins-label">ญาณฯ ถูกหัก — รอผลเพื่อรับคืนพร้อมกำไร</span>
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="w-full mt-3 py-3 rounded-xl font-black text-sm transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
          }}
        >
          รับทราบ ✓
        </button>
      </div>
    </div>
  );
}
