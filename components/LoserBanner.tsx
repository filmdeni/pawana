"use client";
import { useEffect, useRef } from "react";

interface LoserBannerProps {
  xp: number;
  predictionTitle: string;
  onClose: () => void;
}

function playLoseSound() {
  try {
    const ctx = new AudioContext();
    const notes = [392, 349, 311]; // G4 F4 Eb4 — descending
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {}
}

export default function LoserBanner({ xp, predictionTitle, onClose }: LoserBannerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    playLoseSound();
    timerRef.current = setTimeout(onClose, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onClose]);

  return (
    <div className="win-banner-backdrop" onClick={onClose}>
      <div className="lose-banner-card" onClick={(e) => e.stopPropagation()}>
        <div className="lose-glow-ring" aria-hidden />

        <div className="lose-icon">😔</div>

        <h2 className="lose-title">ทายผิด</h2>
        <p className="lose-subtitle" title={predictionTitle}>
          {predictionTitle.length > 48 ? predictionTitle.slice(0, 48) + "…" : predictionTitle}
        </p>

        <div className="win-rewards">
          <div className="win-chip win-chip-xp">
            <span className="win-chip-icon">⚡</span>
            <span className="win-chip-value">+{xp}</span>
            <span className="win-chip-label">XP ประสบการณ์</span>
          </div>
        </div>

        <p className="lose-encouragement">ไว้โชคดีครั้งหน้า — ทุกคำทำนายคือประสบการณ์</p>

        <button className="lose-close-btn" onClick={onClose}>
          รับทราบ
        </button>
      </div>
    </div>
  );
}
