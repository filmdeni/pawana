"use client";
import { useEffect, useRef } from "react";

type Variant =
  | "purple"
  | "indigo"
  | "cyan"
  | "gold"
  | "emerald"
  | "blue"
  | "orange"
  | "slate"
  | "pink"
  | "violet";

interface Props {
  variant?: Variant;
}

const PALETTE: Record<Variant, { orb1: string; orb2: string; orb3: string; accent1: string; accent2: string }> = {
  purple:  {
    orb1: "rgba(111,75,255,0.18)", orb2: "rgba(123,97,255,0.14)", orb3: "rgba(75,57,117,0.22)",
    accent1: "rgba(215,181,109,0.10)", accent2: "rgba(215,181,109,0.07)",
  },
  indigo:  {
    orb1: "rgba(79,70,229,0.20)", orb2: "rgba(99,102,241,0.15)", orb3: "rgba(55,48,163,0.22)",
    accent1: "rgba(167,139,250,0.12)", accent2: "rgba(139,92,246,0.08)",
  },
  cyan:    {
    orb1: "rgba(6,182,212,0.16)", orb2: "rgba(34,211,238,0.12)", orb3: "rgba(8,145,178,0.20)",
    accent1: "rgba(94,211,243,0.10)", accent2: "rgba(103,232,249,0.07)",
  },
  gold:    {
    orb1: "rgba(217,119,6,0.18)", orb2: "rgba(245,158,11,0.14)", orb3: "rgba(161,98,7,0.22)",
    accent1: "rgba(215,181,109,0.14)", accent2: "rgba(253,224,71,0.08)",
  },
  emerald: {
    orb1: "rgba(16,185,129,0.17)", orb2: "rgba(52,211,153,0.13)", orb3: "rgba(6,148,100,0.20)",
    accent1: "rgba(110,231,183,0.10)", accent2: "rgba(167,243,208,0.07)",
  },
  blue:    {
    orb1: "rgba(37,99,235,0.18)", orb2: "rgba(59,130,246,0.14)", orb3: "rgba(29,78,216,0.22)",
    accent1: "rgba(147,197,253,0.10)", accent2: "rgba(96,165,250,0.07)",
  },
  orange:  {
    orb1: "rgba(234,88,12,0.17)", orb2: "rgba(249,115,22,0.13)", orb3: "rgba(194,65,12,0.22)",
    accent1: "rgba(253,186,116,0.12)", accent2: "rgba(215,181,109,0.09)",
  },
  slate:   {
    orb1: "rgba(71,85,105,0.22)", orb2: "rgba(100,116,139,0.15)", orb3: "rgba(51,65,85,0.25)",
    accent1: "rgba(148,163,184,0.09)", accent2: "rgba(203,213,225,0.06)",
  },
  pink:    {
    orb1: "rgba(219,39,119,0.17)", orb2: "rgba(236,72,153,0.13)", orb3: "rgba(157,23,77,0.20)",
    accent1: "rgba(251,182,206,0.10)", accent2: "rgba(244,114,182,0.08)",
  },
  violet:  {
    orb1: "rgba(139,92,246,0.18)", orb2: "rgba(167,139,250,0.14)", orb3: "rgba(109,40,217,0.22)",
    accent1: "rgba(196,181,253,0.10)", accent2: "rgba(221,214,254,0.07)",
  },
};

export default function ParallaxBg({ variant = "purple" }: Props) {
  const layer1 = useRef<HTMLDivElement>(null);
  const layer2 = useRef<HTMLDivElement>(null);
  const layer3 = useRef<HTMLDivElement>(null);
  const c = PALETTE[variant];

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (layer1.current) layer1.current.style.transform = `translateY(${y * 0.15}px)`;
      if (layer2.current) layer2.current.style.transform = `translateY(${y * 0.30}px)`;
      if (layer3.current) layer3.current.style.transform = `translateY(${y * 0.08}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Stars — slowest */}
      <div ref={layer3} className="absolute inset-0 will-change-transform">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o }}
          />
        ))}
      </div>

      {/* Orbs — medium */}
      <div ref={layer1} className="absolute inset-0 will-change-transform">
        <div className="absolute rounded-full" style={{
          width: 520, height: 520, top: "-12%", left: "-8%",
          background: `radial-gradient(circle, ${c.orb1} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }} />
        <div className="absolute rounded-full" style={{
          width: 380, height: 380, top: "30%", right: "-6%",
          background: `radial-gradient(circle, ${c.orb2} 0%, transparent 70%)`,
          filter: "blur(50px)",
        }} />
        <div className="absolute rounded-full" style={{
          width: 300, height: 300, bottom: "5%", left: "20%",
          background: `radial-gradient(circle, ${c.orb3} 0%, transparent 70%)`,
          filter: "blur(45px)",
        }} />
      </div>

      {/* Accent — fastest */}
      <div ref={layer2} className="absolute inset-0 will-change-transform">
        <div className="absolute rounded-full" style={{
          width: 200, height: 200, top: "55%", left: "60%",
          background: `radial-gradient(circle, ${c.accent1} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }} />
        <div className="absolute rounded-full" style={{
          width: 140, height: 140, top: "15%", left: "45%",
          background: `radial-gradient(circle, ${c.accent2} 0%, transparent 70%)`,
          filter: "blur(30px)",
        }} />
      </div>
    </div>
  );
}

const STARS = Array.from({ length: 80 }, (_, i) => {
  const s1 = (i * 9301 + 49297) % 233280;
  const s2 = (s1 * 9301 + 49297) % 233280;
  const s3 = (s2 * 9301 + 49297) % 233280;
  const s4 = (s3 * 9301 + 49297) % 233280;
  return { x: (s1 / 233280) * 100, y: (s2 / 233280) * 100, r: (s3 / 233280) * 2 + 0.8, o: (s4 / 233280) * 0.25 + 0.05 };
});
