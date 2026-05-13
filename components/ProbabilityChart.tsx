"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#60a5fa", "#f97316", "#4ade80", "#facc15", "#c084fc"];

interface Props {
  options: string[];
  /** rows: { date: string; [option]: number }[] — date in "MMM D" format */
  data: Record<string, number | string>[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="ml-auto pl-4 font-bold text-white">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function ProbabilityChart({ options, data }: Props) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">ความน่าจะเป็น</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map((opt, i) => (
          <span key={opt} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS[i % COLORS.length] }}>
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {opt}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {options.map((opt, i) => (
            <Line
              key={opt}
              type="monotone"
              dataKey={opt}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
