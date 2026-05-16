"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface Props {
  endsAt: string;
  closingLabel: string;
}

export default function CountdownSection({ endsAt, closingLabel }: Props) {
  const [hms, setHms] = useState({ h: 0, m: 0, s: 0, done: false });

  useEffect(() => {
    function tick() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setHms({ h: 0, m: 0, s: 0, done: true });
        return;
      }
      setHms({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const diff = new Date(endsAt).getTime() - Date.now();

  if (hms.done || diff <= 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(94,211,166,0.08)", border: "1px solid rgba(94,211,166,0.2)" }}>
        <span className="text-sm font-black" style={{ color: "#5ED3A6" }}>✓ หมดเวลาแล้ว</span>
        <span className="text-xs text-[var(--text-muted)]">· {closingLabel}</span>
      </div>
    );
  }

  // > 24h → แสดง วัน ชม.
  const isUrgent = hms.h === 0 && diff < 86_400_000;
  const color = isUrgent ? "#ef4444" : "#f97316";
  const shadow = isUrgent ? "0 0 20px rgba(239,68,68,0.5)" : "0 0 20px rgba(249,115,22,0.3)";

  let units: { v: number; u: string }[];
  if (diff >= 86_400_000) {
    const days = Math.floor(diff / 86_400_000);
    const hrs  = Math.floor((diff % 86_400_000) / 3_600_000);
    units = hrs > 0
      ? [{ v: days, u: "วัน" }, { v: hrs, u: "ชม." }]
      : [{ v: days, u: "วัน" }];
  } else if (hms.h > 0) {
    units = [{ v: hms.h, u: "ชม." }, { v: hms.m, u: "นาที" }, { v: hms.s, u: "วิ" }];
  } else {
    units = [{ v: hms.m, u: "นาที" }, { v: hms.s, u: "วิ" }];
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
      <Timer className="w-3.5 h-3.5" />
      ปิดรับทำนาย · {closingLabel}
    </div>
  );
}
