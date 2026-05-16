"use client";
import { TrendingUp } from "lucide-react";
import { clampPct } from "@/lib/poolDisplay";

// Matches ProbabilityChart COLORS exactly
const OPTION_COLORS = [
  { text: "#60a5fa", bar: "linear-gradient(90deg,#1e40af,#3b82f6,#60a5fa)", glow: "rgba(96,165,250,0.6)" },
  { text: "#f97316", bar: "linear-gradient(90deg,#7c2d12,#ea580c,#f97316)", glow: "rgba(249,115,22,0.6)" },
  { text: "#4ade80", bar: "linear-gradient(90deg,#14532d,#16a34a,#4ade80)", glow: "rgba(74,222,128,0.6)" },
  { text: "#facc15", bar: "linear-gradient(90deg,#713f12,#ca8a04,#facc15)", glow: "rgba(250,204,21,0.6)" },
  { text: "#c084fc", bar: "linear-gradient(90deg,#581c87,#9333ea,#c084fc)", glow: "rgba(192,132,252,0.6)" },
];

interface CinematicPoolBarProps {
  yesPct?: number;
  noPct?: number;
  yesPool?: number;
  noPool?: number;
  live?: boolean;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  optionPools?: number[] | null;
}

export default function CinematicPoolBar({
  yesPct = 50, noPct = 50, yesPool = 0, noPool = 0,
  live, yesLabel = "ใช่", noLabel = "ไม่ใช่",
  options, optionPools,
}: CinematicPoolBarProps) {
  const isMulti = options && options.length > 2;

  if (isMulti) {
    const pools = optionPools ?? options!.map(() => 0);
    const total = pools.reduce((s, v) => s + v, 0) || 1;
    const pcts = pools.map((p) => Math.round((p / total) * 100));

    return (
      <div className="space-y-2.5">
        {/* Segmented bar */}
        <div className="flex rounded-full overflow-hidden" style={{ height: "12px", background: "rgba(255,255,255,0.06)", gap: "2px" }}>
          {options!.map((_, i) => (
            <div
              key={i}
              className="transition-all duration-700 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${pcts[i]}%`,
                background: OPTION_COLORS[i % OPTION_COLORS.length].bar,
                minWidth: pcts[i] > 0 ? 6 : 0,
                boxShadow: `0 0 8px ${OPTION_COLORS[i % OPTION_COLORS.length].glow}`,
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {options!.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OPTION_COLORS[i % OPTION_COLORS.length].text }} />
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
              <span className="text-xs font-black" style={{ color: OPTION_COLORS[i % OPTION_COLORS.length].text }}>{pcts[i]}%</span>
            </div>
          ))}
          {live && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400">LIVE</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Binary
  const { yes: yesW, no: noW } = clampPct(yesPct);
  const dominant = yesW >= noW ? "yes" : "no";

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className="text-left">
          <div className="text-4xl font-black leading-none tabular-nums" style={{ color: "#5ED3A6", textShadow: "0 0 24px rgba(94,211,166,0.5)" }}>
            {yesW}%
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: "#5ED3A6" }}>{yesLabel}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          {live && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400">LIVE</span>
            </div>
          )}
          <TrendingUp className="w-4 h-4" style={{ color: dominant === "yes" ? "#5ED3A6" : "#F87171" }} />
        </div>

        <div className="text-right">
          <div className="text-4xl font-black leading-none tabular-nums" style={{ color: "#F87171", textShadow: "0 0 24px rgba(239,68,68,0.5)" }}>
            {noW}%
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: "#F87171" }}>{noLabel}</div>
        </div>
      </div>

      <div className="relative rounded-full overflow-hidden" style={{ height: "10px", background: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{ width: `${yesW}%`, background: "linear-gradient(90deg,#16a34a,#22c55e,#5ED3A6)", boxShadow: "4px 0 16px rgba(94,211,166,0.6)" }} />
        <div className="absolute inset-y-0 right-0 transition-all duration-700"
          style={{ width: `${noW}%`, background: "linear-gradient(270deg,#7f1d1d,#dc2626,#F87171)", boxShadow: "-4px 0 16px rgba(239,68,68,0.6)" }} />
      </div>

      <div className="flex justify-between text-xs font-semibold">
        <span style={{ color: "rgba(94,211,166,0.7)" }}>{yesPool.toLocaleString()} ญาณ</span>
        <span style={{ color: "rgba(239,68,68,0.7)" }}>{noPool.toLocaleString()} ญาณ</span>
      </div>
    </div>
  );
}
