"use client";
import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWinNotification } from "@/lib/hooks/useWinNotification";

function playWinSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.5);
    });
  } catch {}
}

function WinToast({ coins, xp, title, type, predictionId, onClose, onViewDetail }: {
  coins: number; xp: number; title: string; type: "win" | "lose"; predictionId?: string; onClose: () => void; onViewDetail?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (type === "win") playWinSound();
  }, [type]);

  const isWin = type === "win";

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isWin ? "linear-gradient(160deg,#1A1530,#0F0C1E)" : "linear-gradient(160deg,#1A1520,#0F0C1E)",
          border: isWin ? "2px solid rgba(215,181,109,0.6)" : "2px solid rgba(150,100,200,0.4)",
          borderRadius: 24,
          padding: "2.5rem 2rem",
          width: "min(380px, 90vw)",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>{isWin ? "🏆" : "😔"}</div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: 8, color: isWin ? "#D7B56D" : "#a78bfa" }}>
          {isWin ? "ทายถูก!" : "ทายผิด"}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#aaa", marginBottom: 20, wordBreak: "break-word" }}>
          {title.length > 50 ? title.slice(0, 50) + "…" : title}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {isWin && (
            <div style={{ background: "rgba(215,181,109,0.15)", border: "1px solid rgba(215,181,109,0.4)", borderRadius: 12, padding: "10px 20px", display: "flex", alignItems: "center", gap: 6 }}>
              <Image src="/images/point2.png" alt="coin" width={16} height={16} />
              <span style={{ fontWeight: 900, color: "#D7B56D", fontSize: "1.1rem" }}>+{coins.toLocaleString()}</span>
              <span style={{ color: "#aaa", fontSize: "0.8rem" }}>ญาณฯ</span>
            </div>
          )}
          <div style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: 12, padding: "10px 20px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 900, color: "#a78bfa", fontSize: "1.1rem" }}>+{xp}</span>
            <span style={{ color: "#aaa", fontSize: "0.8rem" }}>XP</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {predictionId && onViewDetail && (
            <button
              onClick={onViewDetail}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: "1px solid rgba(167,139,250,0.5)",
                background: "rgba(139,92,246,0.15)",
                color: "#a78bfa",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              ดูรายละเอียด →
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: isWin ? "linear-gradient(135deg,#b8960c,#D7B56D)" : "linear-gradient(135deg,#6d28d9,#8b5cf6)",
              color: "#fff",
              fontWeight: 900,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {isWin ? "รับรางวัล ✓" : "รับทราบ"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WinNotificationLayer({ userId }: { userId: string | null }) {
  const router = useRouter();
  const { resultEvent, dismiss } = useWinNotification(userId);

  const handleClose = useCallback(() => {
    dismiss();
    router.refresh();
  }, [dismiss, router]);

  const handleViewDetail = useCallback(() => {
    if (resultEvent?.predictionId) {
      dismiss();
      router.push(`/predict/${resultEvent.predictionId}`);
    }
  }, [dismiss, router, resultEvent]);

  if (!resultEvent) return null;

  return (
    <WinToast
      coins={resultEvent.coins}
      xp={resultEvent.xp}
      title={resultEvent.predictionTitle}
      type={resultEvent.type}
      predictionId={resultEvent.predictionId}
      onClose={handleClose}
      onViewDetail={handleViewDetail}
    />
  );
}
