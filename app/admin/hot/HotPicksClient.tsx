"use client";

import { useState, useTransition } from "react";
import { Flame, Search, X, Check, Loader2, GripVertical } from "lucide-react";
import { saveHotPicks } from "@/lib/actions/hotPicks";
import Image from "next/image";

interface Prediction {
  id: string;
  title: string;
  image_url: string | null;
  participant_count: number;
  ends_at: string;
  categories: { label: string } | null;
}

interface Props {
  predictions: Prediction[];
  initialSlots: (string | null)[];
}

export default function HotPicksClient({ predictions, initialSlots }: Props) {
  const [slots, setSlots] = useState<(string | null)[]>(initialSlots);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const predMap = new Map(predictions.map((p) => [p.id, p]));

  const filtered = predictions.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.categories?.label ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function addToSlot(predId: string) {
    // If already in a slot, do nothing
    if (slots.includes(predId)) return;
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return; // all slots full
    const next = [...slots];
    next[emptyIdx] = predId;
    setSlots(next);
    setSaved(false);
  }

  function removeSlot(idx: number) {
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveHotPicks(slots);
      setSaved(true);
    });
  }

  const filledCount = slots.filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      {/* LEFT: 4 slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            การ์ดที่เลือก ({filledCount}/4)
          </h2>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: saved ? "rgba(94,211,166,0.15)" : "linear-gradient(135deg,#6F4BFF,#A78BFA)",
              color: saved ? "#5ED3A6" : "white",
              border: saved ? "1px solid #5ED3A630" : "none",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saved ? "บันทึกแล้ว" : "บันทึก"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((id, idx) => {
            const pred = id ? predMap.get(id) : null;
            return (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden flex items-center gap-3 p-4"
                style={{
                  border: pred
                    ? "1px solid rgba(111,75,255,0.3)"
                    : "1px dashed rgba(255,255,255,0.1)",
                  background: pred ? "rgba(111,75,255,0.06)" : "rgba(255,255,255,0.02)",
                  minHeight: 80,
                }}
              >
                <span className="text-xs font-black text-[var(--text-muted)] w-5 text-center flex-shrink-0">
                  {idx + 1}
                </span>
                {pred ? (
                  <>
                    {pred.image_url ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={pred.image_url} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        🔥
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">{pred.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {pred.categories?.label} · 🔥 {pred.participant_count.toLocaleString()} คน
                      </p>
                    </div>
                    <button
                      onClick={() => removeSlot(idx)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-red-400" />
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">ว่าง — คลิกการ์ดทางขวาเพื่อเพิ่ม</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          หากเลือกครบ 4 ใบ ระบบจะแสดงการ์ดเหล่านี้บนหน้าแรก ถ้าไม่ครบจะแสดงตามยอดนิยมอัตโนมัติ
        </p>
      </div>

      {/* RIGHT: prediction list */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 620 }}>
        <div className="px-4 pt-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">คำถามทั้งหมด</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาคำถาม..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[rgba(111,75,255,0.4)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">ไม่พบคำถาม</p>
          )}
          {filtered.map((p) => {
            const selected = slots.includes(p.id);
            const slotIdx = slots.indexOf(p.id);
            const full = filledCount >= 4 && !selected;
            return (
              <button
                key={p.id}
                onClick={() => selected ? removeSlot(slotIdx) : addToSlot(p.id)}
                disabled={full}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-40"
                style={selected ? { background: "rgba(111,75,255,0.08)" } : undefined}
              >
                {p.image_url ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={p.image_url} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    🔮
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">{p.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {p.categories?.label} · 🔥 {p.participant_count.toLocaleString()} คน
                  </p>
                </div>
                {selected && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(111,75,255,0.2)", color: "#A78BFA" }}>
                    สล็อต {slotIdx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
