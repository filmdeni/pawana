"use client";

import { useState, useTransition } from "react";
import { setHomeSections, HomeSections } from "@/lib/actions/appConfig";
import { Eye, EyeOff, Save } from "lucide-react";

const SECTION_LABELS: { key: keyof HomeSections; label: string; desc: string }[] = [
  { key: "hero",        label: "Hero Banner",          desc: "การ์ด Live prediction ด้านบนสุด" },
  { key: "stats_bar",   label: "Stats Bar",            desc: "แถบสถิติรวม (ผู้ใช้, ยอดพาวนา ฯลฯ)" },
  { key: "quick",       label: "คนกำลังทาย",           desc: "Section LIVE ที่มีคนโหวตอยู่ขณะนี้" },
  { key: "trending",    label: "กระแสแรง",             desc: "Predictions ที่กำลังเป็นกระแส" },
  { key: "ending_soon", label: "ใกล้เฉลย",             desc: "Predictions ที่ใกล้หมดเวลา" },
  { key: "for_you",     label: "เพื่อคุณ (AI Picks)",  desc: "Predictions ที่ AI แนะนำเฉพาะบุคคล" },
  { key: "missions",    label: "ภารกิจประจำวัน",       desc: "Daily missions และ reward" },
  { key: "shop",        label: "ร้านค้าพาวนา",         desc: "Banner โปรโมทร้านค้า" },
  { key: "rank_card",   label: "การ์ดอันดับผู้ใช้",    desc: "แผงขวา — XP และอันดับโลก" },
  { key: "leaderboard", label: "Leaderboard",           desc: "แผงขวา — 5 นักพยากรณ์ยอดนิยม" },
  { key: "community",   label: "กระแสล่าสุดในชุมชน",  desc: "แผงขวา — โพสต์ล่าสุด" },
];

export default function HomeSectionsClient({ initial }: { initial: HomeSections }) {
  const [sections, setSections] = useState<HomeSections>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(key: keyof HomeSections) {
    setSections((s) => ({ ...s, [key]: !s[key] }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await setHomeSections(sections);
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        {SECTION_LABELS.map(({ key, label, desc }) => {
          const on = sections[key];
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="flex items-center gap-3 p-4 rounded-2xl border text-left transition-all"
              style={{
                background: on ? "rgba(111,75,255,0.08)" : "rgba(255,255,255,0.03)",
                borderColor: on ? "rgba(111,75,255,0.35)" : "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: on ? "rgba(111,75,255,0.2)" : "rgba(255,255,255,0.05)" }}
              >
                {on
                  ? <Eye className="w-4 h-4 text-violet-400" />
                  : <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug"
                  style={{ color: on ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {label}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5 truncate">{desc}</p>
              </div>
              <div
                className="ml-auto w-10 h-5 rounded-full relative flex-shrink-0 transition-all"
                style={{ background: on ? "#6F4BFF" : "rgba(255,255,255,0.12)" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: on ? "calc(100% - 18px)" : "2px" }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#6F4BFF,#9B59FF)", color: "#fff" }}
        >
          <Save className="w-4 h-4" />
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        {saved && (
          <span className="text-sm text-[#5ED3A6] font-semibold">บันทึกแล้ว ✓</span>
        )}
      </div>
    </div>
  );
}
