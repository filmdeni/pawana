"use client";

const TIER_THRESHOLDS = [
  { level: 0,  tier: "bronze",   label: "บรอนซ์",   color: "#cd7f32" },
  { level: 10, tier: "silver",   label: "ซิลเวอร์", color: "#b0b8c8" },
  { level: 20, tier: "gold",     label: "โกลด์",    color: "#D7B56D" },
  { level: 35, tier: "platinum", label: "แพลตินัม", color: "#e2f0ff" },
  { level: 50, tier: "diamond",  label: "ไดมอนด์",  color: "#88eeff" },
  { level: 70, tier: "legend",   label: "ตำนาน",    color: "#d480ff" },
];

function getTier(level: number) {
  let current = TIER_THRESHOLDS[0];
  for (const t of TIER_THRESHOLDS) {
    if (level >= t.level) current = t;
  }
  return current;
}

export default function XPBar({
  current,
  max,
  level,
}: {
  current: number;
  max: number;
  level: number;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const tier = getTier(level);
  const nearMax = pct >= 80;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-black" style={{ color: tier.color }}>
            Lv.{level}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border"
            style={{
              color: tier.color,
              background: `${tier.color}15`,
              borderColor: `${tier.color}40`,
            }}
          >
            {tier.label}
          </span>
        </div>
        <span className="text-[var(--text-muted)]">
          {current.toLocaleString()} / {max.toLocaleString()} XP
        </span>
      </div>

      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        {/* Track glow */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
            boxShadow: nearMax ? `0 0 10px ${tier.color}80` : undefined,
          }}
        />
        {/* Shine */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
          }}
        />
      </div>

      {nearMax && (
        <p className="text-[10px] font-semibold text-right" style={{ color: tier.color }}>
          ✦ ใกล้เลเวลอัป!
        </p>
      )}
    </div>
  );
}
