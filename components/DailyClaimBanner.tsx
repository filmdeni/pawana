"use client";
import { useState } from "react";
import { claimDaily } from "@/lib/actions/rewards";

interface Props {
  canClaim: boolean;
}

export default function DailyClaimBanner({ canClaim: initialCanClaim }: Props) {
  const [canClaim, setCanClaim] = useState(initialCanClaim);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!canClaim && !justClaimed) return null;

  async function handleClaim() {
    if (claiming || !canClaim) return;
    setClaiming(true);
    const res = await claimDaily();
    setClaiming(false);
    if (res.ok) {
      setEarned(50);
      setCanClaim(false);
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 4000);
    }
  }

  if (justClaimed) {
    return (
      <div
        className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(94,211,166,0.12), rgba(94,211,166,0.06))",
          border: "1px solid rgba(94,211,166,0.3)",
          animation: "slideDown 0.3s ease",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--success)" }}>
              รับ ญาณ รายวันแล้ว!
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              มาใหม่พรุ่งนี้เพื่อรับอีก 50 ญาณ
            </div>
          </div>
        </div>
        <div className="font-black text-lg" style={{ color: "var(--gold)" }}>
          +{earned} ญาณ
        </div>
        <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={claiming}
      className="w-full flex items-center justify-between rounded-2xl px-4 py-3 mb-4 transition-all group"
      style={{
        background: "linear-gradient(135deg, rgba(215,181,109,0.1), rgba(215,181,109,0.05))",
        border: "1px solid rgba(215,181,109,0.35)",
        cursor: claiming ? "wait" : "pointer",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{
            background: "rgba(215,181,109,0.15)",
            border: "1px solid rgba(215,181,109,0.3)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          🎁
        </div>
        <div className="text-left">
          <div className="font-bold text-sm" style={{ color: "var(--gold)" }}>
            รับ ญาณ ประจำวัน
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            รับฟรีทุกวัน ไม่มีหมดอายุ
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-sm transition-all group-hover:scale-105"
        style={{
          background: claiming ? "var(--bg-panel)" : "linear-gradient(135deg, var(--gold), var(--gold-soft))",
          color: claiming ? "var(--text-muted)" : "#1a1200",
          boxShadow: claiming ? "none" : "0 0 16px rgba(215,181,109,0.35)",
        }}
      >
        {claiming ? "..." : "+50 ญาณ"}
      </div>
    </button>
  );
}
