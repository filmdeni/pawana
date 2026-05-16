"use client";
import { useEffect, useState } from "react";
import { markWelcomed } from "@/lib/actions/rewards";

interface Props {
  isNewUser: boolean;
  coins?: number;
}

export default function WelcomeModal({ isNewUser, coins: startingCoins = 1000 }: Props) {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    if (!isNewUser) return;
    // slight delay so page renders first
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, [isNewUser]);

  // count-up animation
  useEffect(() => {
    if (!show) return;
    let n = 0;
    const step = Math.ceil(startingCoins / 40);
    const id = setInterval(() => {
      n = Math.min(n + step, startingCoins);
      setCounted(n);
      if (n >= startingCoins) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [show, startingCoins]);

  async function handleClose() {
    setClosing(true);
    await markWelcomed();
    setTimeout(() => setShow(false), 300);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(5,6,10,0.85)",
        backdropFilter: "blur(12px)",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.3s",
      }}
      onClick={handleClose}
    >
      <div
        className="relative max-w-sm w-full rounded-3xl overflow-hidden text-center"
        style={{
          background: "linear-gradient(135deg, #1a1430, #12101C)",
          border: "1px solid rgba(111,75,255,0.4)",
          boxShadow: "0 0 80px rgba(111,75,255,0.3), 0 0 0 1px rgba(111,75,255,0.1)",
          animation: closing ? "none" : "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(111,75,255,0.25), transparent 70%)",
          }}
        />

        {/* Stars / confetti decoration */}
        <div className="text-5xl pt-10 pb-2 relative">🎉</div>

        <div className="px-8 pb-8 relative">
          <h2 className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
            ยินดีต้อนรับ!
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            สร้างบัญชีสำเร็จแล้ว คุณได้รับ ญาณ เริ่มต้นฟรี
          </p>

          {/* Coin display */}
          <div
            className="rounded-2xl py-6 mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(215,181,109,0.12), rgba(215,181,109,0.06))",
              border: "1px solid rgba(215,181,109,0.3)",
            }}
          >
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--gold-soft)" }}>
              ยอด ญาณ ของคุณ
            </div>
            <div
              className="text-5xl font-black tabular-nums"
              style={{
                color: "var(--gold)",
                textShadow: "0 0 30px rgba(215,181,109,0.5)",
              }}
            >
              {counted.toLocaleString()}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--gold-soft)" }}>ญาณ</div>
          </div>

          {/* What to do */}
          <div className="space-y-2 text-left mb-6">
            {[
              { icon: "₿", text: "ทาย BTC ขึ้น/ลง ทุก 5 นาที" },
              { icon: "🎯", text: "ทายคำถามทั่วไปเพื่อสะสม ญาณ" },
              { icon: "🏆", text: "แข่งขันขึ้น Leaderboard" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: "rgba(111,75,255,0.15)", border: "1px solid rgba(111,75,255,0.2)" }}
                >
                  {icon}
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl font-black text-base transition-all"
            style={{
              background: "linear-gradient(135deg, var(--purple), #8B5CF6)",
              color: "#fff",
              boxShadow: "0 0 24px rgba(111,75,255,0.4)",
            }}
          >
            เริ่มทายเลย! 🚀
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
