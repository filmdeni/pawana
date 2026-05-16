"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface WinBannerProps {
  coins: number;
  xp: number;
  predictionTitle: string;
  onClose: () => void;
}

function playWinSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {}
}

export default function WinBanner({ coins, xp, predictionTitle, onClose }: WinBannerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    playWinSound();
    timerRef.current = setTimeout(onClose, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onClose]);

  return createPortal(
    <div className="win-banner-backdrop" onClick={onClose}>
      <div className="win-banner-card" onClick={(e) => e.stopPropagation()}>
        <div className="win-confetti" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="win-confetti-dot" style={{
              "--i": i,
              "--hue": `${(i * 37) % 360}`,
            } as React.CSSProperties} />
          ))}
        </div>

        <div className="win-glow-ring" aria-hidden />
        <div className="win-trophy">🏆</div>

        <h2 className="win-title">ทายถูก!</h2>
        <p className="win-subtitle" title={predictionTitle}>
          {predictionTitle.length > 48 ? predictionTitle.slice(0, 48) + "…" : predictionTitle}
        </p>

        <div className="win-rewards">
          <div className="win-chip win-chip-coins">
            <Image src="/images/point2.png" alt="coin" width={18} height={18} className="win-chip-icon" />
            <span className="win-chip-value">+{coins.toLocaleString()}</span>
            <span className="win-chip-label">ญาณฯ</span>
          </div>
          <div className="win-chip win-chip-xp">
            <span className="win-chip-icon">⚡</span>
            <span className="win-chip-value">+{xp}</span>
            <span className="win-chip-label">XP</span>
          </div>
        </div>

        <button className="win-close-btn" onClick={onClose}>
          รับรางวัล
        </button>
      </div>
    </div>,
    document.body
  );
}
