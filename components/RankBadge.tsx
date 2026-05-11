type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legend";

const tierConfig: Record<Tier, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  shadow: string;
  glow?: string;
}> = {
  bronze:   { label: "บรอนซ์",   icon: "⚔",  color: "#cd7f32", bg: "rgba(205,127,50,0.10)",  border: "rgba(205,127,50,0.30)", shadow: "rgba(205,127,50,0.25)" },
  silver:   { label: "ซิลเวอร์", icon: "🛡",  color: "#b0b8c8", bg: "rgba(176,184,200,0.10)", border: "rgba(176,184,200,0.30)", shadow: "rgba(176,184,200,0.20)" },
  gold:     { label: "โกลด์",    icon: "⭐",  color: "#D7B56D", bg: "rgba(215,181,109,0.12)", border: "rgba(215,181,109,0.35)", shadow: "rgba(215,181,109,0.30)" },
  platinum: { label: "แพลตินัม", icon: "💎",  color: "#e2f0ff", bg: "rgba(226,240,255,0.10)", border: "rgba(226,240,255,0.35)", shadow: "rgba(226,240,255,0.25)" },
  diamond:  { label: "ไดมอนด์",  icon: "🔷",  color: "#88eeff", bg: "rgba(136,238,255,0.10)", border: "rgba(136,238,255,0.40)", shadow: "rgba(136,238,255,0.30)" },
  legend:   { label: "ตำนาน",    icon: "👑",  color: "#d480ff", bg: "rgba(212,128,255,0.12)", border: "rgba(212,128,255,0.45)", shadow: "rgba(212,128,255,0.40)", glow: "legend-pulse" },
};

export default function RankBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
  const c = tierConfig[tier];
  const sz = size === "lg"
    ? "px-3 py-1.5 text-sm gap-1.5"
    : size === "md"
    ? "px-2.5 py-1 text-xs gap-1"
    : "px-2 py-0.5 text-[11px] gap-1";
  const iconSz = size === "lg" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${sz} ${c.glow ?? ""}`}
      style={{
        color: c.color,
        backgroundColor: c.bg,
        borderColor: c.border,
        boxShadow: `0 0 10px ${c.shadow}`,
      }}
    >
      <span className={iconSz}>{c.icon}</span>
      {c.label}
    </span>
  );
}
