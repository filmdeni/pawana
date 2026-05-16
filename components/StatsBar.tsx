"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

function useAnimatedNumber(base: number, variance: number, interval: number) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const iv = setInterval(() => {
      setVal(base + Math.floor((Math.random() - 0.5) * variance * 2));
    }, interval);
    return () => clearInterval(iv);
  }, [base, variance, interval]);
  return val;
}

export default function StatsBar() {
  const resolved = useAnimatedNumber(250, 3, 3200);
  const open = useAnimatedNumber(32, 2, 4700);
  const total = useAnimatedNumber(203000, 500, 2800);

  const [glowPos, setGlowPos] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setGlowPos(p => (p + 1) % 100), 30);
    return () => clearInterval(iv);
  }, []);

  const fmtTotal = total >= 1000 ? `${(total / 1000).toFixed(1)}K` : String(total);

  return (
    <div className="relative text-[11px] font-semibold">
      <div className="flex items-center gap-5 px-1 py-1">

        {/* LIVE */}
        <span className="flex items-center gap-1.5 flex-shrink-0" style={{ color: "#ff7070" }}>
          <span className="relative flex-shrink-0">
            <span className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#ff4444", boxShadow: "0 0 6px #f87171", animation: "live-pulse 1.2s ease-in-out infinite" }} />
            <span className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "#ff4444", opacity: 0.4 }} />
          </span>
          LIVE
        </span>

        <div className="w-px h-3 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Resolved today */}
        <span className="hidden sm:flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="text-xs">👥</span>
          <span className="tabular-nums transition-all duration-500" style={{ color: "rgba(255,255,255,0.7)" }}>
            {resolved.toLocaleString()}
          </span>
          ทายวันนี้
        </span>

        <div className="hidden sm:block w-px h-3 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Open questions */}
        <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="text-xs">🎯</span>
          <span className="tabular-nums transition-all duration-500" style={{ color: "#a78bfa" }}>
            {open}
          </span>
          คำถามเปิดอยู่
        </span>

        <div className="hidden sm:block w-px h-3 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Total points */}
        <span className="hidden sm:flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          <Image src="/images/point2.png" alt="p" width={13} height={13} />
          <span className="tabular-nums transition-all duration-500" style={{ color: "#D7B56D" }}>
            {fmtTotal}
          </span>
          คะแนนรวม
        </span>
      </div>
    </div>
  );
}

