"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil, X, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeroSlide {
  id: string;
  sort_order: number;
  lines: string[];
  category: string;
  yes_pct: number;
  yes_label: string;
  no_label: string;
  yes_btn: string;
  no_btn: string;
  duration_hours: number;
  viewers: number;
  heat_level: number;
  prediction_id: string;
  bg_image: string;
  active: boolean;
}

type SlideForm = Omit<HeroSlide, "id" | "sort_order">;

const EMPTY: SlideForm = {
  lines: [""],
  category: "",
  yes_pct: 50,
  yes_label: "เชื่อว่าใช่",
  no_label: "เชื่อว่าไม่ใช่",
  yes_btn: "ฉันว่าใช่",
  no_btn: "ฉันว่าไม่",
  duration_hours: 2,
  viewers: 1000,
  heat_level: 3,
  prediction_id: "",
  bg_image: "",
  active: true,
};

export default function HeroBannerClient() {
  const supabase = createClient();

  const [slides, setSlides]     = useState<HeroSlide[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState<SlideForm>(EMPTY);
  const [isNew, setIsNew]       = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { fetchSlides(); }, []);

  async function fetchSlides() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order");
    if (error) setError(error.message);
    else setSlides(data ?? []);
    setLoading(false);
  }

  function openEdit(slide: HeroSlide) {
    const { id, sort_order, ...rest } = slide;
    setForm(rest);
    setEditing(id);
    setIsNew(false);
    setError(null);
  }

  function openNew() {
    setForm({ ...EMPTY });
    setEditing("__new__");
    setIsNew(true);
    setError(null);
  }

  function closeEdit() { setEditing(null); }

  async function saveEdit() {
    startTransition(async () => {
      setError(null);
      if (isNew) {
        const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;
        const { error } = await supabase
          .from("hero_slides")
          .insert({ ...form, sort_order: maxOrder });
        if (error) { setError(error.message); return; }
      } else {
        const { error } = await supabase
          .from("hero_slides")
          .update(form)
          .eq("id", editing);
        if (error) { setError(error.message); return; }
      }
      await fetchSlides();
      setEditing(null);
      flashSaved();
    });
  }

  async function deleteSlide(id: string) {
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setSlides(s => s.filter(sl => sl.id !== id));
  }

  async function toggleActive(slide: HeroSlide) {
    const { error } = await supabase
      .from("hero_slides")
      .update({ active: !slide.active })
      .eq("id", slide.id);
    if (error) { setError(error.message); return; }
    setSlides(s => s.map(sl => sl.id === slide.id ? { ...sl, active: !sl.active } : sl));
  }

  async function moveSlide(id: string, dir: -1 | 1) {
    const i = slides.findIndex(sl => sl.id === id);
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;

    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    // reindex
    const updated = next.map((sl, idx) => ({ ...sl, sort_order: idx }));
    setSlides(updated);

    await Promise.all([
      supabase.from("hero_slides").update({ sort_order: updated[i].sort_order }).eq("id", updated[i].id),
      supabase.from("hero_slides").update({ sort_order: updated[j].sort_order }).eq("id", updated[j].id),
    ]);
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function setLine(idx: number, val: string) {
    const lines = [...form.lines];
    lines[idx] = val;
    setForm(f => ({ ...f, lines }));
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Hero Banner</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">จัดการ slide ที่แสดงบนหน้าแรก</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check className="w-4 h-4" /> บันทึกแล้ว
            </span>
          )}
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", border:"1px solid rgba(124,58,237,0.5)" }}>
            <Plus className="w-4 h-4" />
            เพิ่ม Slide
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Slide list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> กำลังโหลด…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {slides.map((slide, i) => (
            <div key={slide.id}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background:"rgba(255,255,255,0.03)",
                border:`1px solid ${slide.active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)"}`,
                opacity: slide.active ? 1 : 0.5,
              }}>

              {/* Order controls */}
              <div className="flex flex-col gap-1">
                <button onClick={() => moveSlide(slide.id, -1)} disabled={i === 0}
                  className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors">
                  <GripVertical className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
                </button>
                <button onClick={() => moveSlide(slide.id, 1)} disabled={i === slides.length - 1}
                  className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-colors">
                  <GripVertical className="w-4 h-4 text-[var(--text-muted)] -rotate-90" />
                </button>
              </div>

              {/* Order number */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background:"rgba(124,58,237,0.2)", color:"#a78bfa" }}>
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background:"rgba(90,50,200,0.2)", color:"#b09aff", border:"1px solid rgba(100,60,220,0.3)" }}>
                    {slide.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">ID: {slide.prediction_id}</span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {slide.lines.join(" · ")}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                  <span>YES {slide.yes_pct}%</span>
                  <span>·</span>
                  <span>{slide.viewers.toLocaleString()} คน</span>
                  <span>·</span>
                  <span>{"🔥".repeat(slide.heat_level)}</span>
                  <span>·</span>
                  <span>{slide.duration_hours}h</span>
                </div>
              </div>

              {/* BG preview */}
              {slide.bg_image && (
                <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.bg_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(slide)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title={slide.active ? "ซ่อน" : "แสดง"}>
                  {slide.active
                    ? <Eye className="w-4 h-4 text-emerald-400" />
                    : <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>
                <button onClick={() => openEdit(slide)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Pencil className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
                <button onClick={() => deleteSlide(slide.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}

          {slides.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)]">
              ยังไม่มี Slide — กด <strong>เพิ่ม Slide</strong> เพื่อเริ่ม
            </div>
          )}
        </div>
      )}

      {/* Edit / New modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background:"#0f0a24", border:"1px solid rgba(124,58,237,0.35)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(124,58,237,0.15)]">
              <h2 className="text-base font-black text-white">
                {isNew ? "เพิ่ม Slide ใหม่" : "แก้ไข Slide"}
              </h2>
              <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300"
                  style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}

              {/* Lines */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                  ข้อความ (ใช้ {"{"} {"}"} ครอบคำที่ต้องการ highlight)
                </label>
                {form.lines.map((line, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={line} onChange={e => setLine(i, e.target.value)}
                      placeholder={`บรรทัดที่ ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", outline:"none" }} />
                    {form.lines.length > 1 && (
                      <button onClick={() => setForm(f => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }))}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, ""] }))}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> เพิ่มบรรทัด
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="หมวดหมู่" value={form.category}
                  onChange={v => setForm(f => ({ ...f, category: v }))} />
                <Field label="Prediction ID" value={form.prediction_id}
                  onChange={v => setForm(f => ({ ...f, prediction_id: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Label YES" value={form.yes_label}
                  onChange={v => setForm(f => ({ ...f, yes_label: v }))} />
                <Field label="Label NO" value={form.no_label}
                  onChange={v => setForm(f => ({ ...f, no_label: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ปุ่ม YES" value={form.yes_btn}
                  onChange={v => setForm(f => ({ ...f, yes_btn: v }))} />
                <Field label="ปุ่ม NO" value={form.no_btn}
                  onChange={v => setForm(f => ({ ...f, no_btn: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField label="YES % เริ่มต้น" min={1} max={99}
                  value={form.yes_pct} onChange={v => setForm(f => ({ ...f, yes_pct: v }))} />
                <NumberField label="ระยะเวลา (ชั่วโมง)" min={1} max={168}
                  value={form.duration_hours} onChange={v => setForm(f => ({ ...f, duration_hours: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField label="จำนวนผู้ชม (เริ่มต้น)" min={0} max={999999}
                  value={form.viewers} onChange={v => setForm(f => ({ ...f, viewers: v }))} />
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">ความร้อนแรง</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, heat_level: n }))}
                        className="text-xl transition-opacity"
                        style={{ opacity: n <= form.heat_level ? 1 : 0.2 }}>
                        🔥
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Field label="Background Image Path" value={form.bg_image}
                placeholder="/images/hero/xxx.png"
                onChange={v => setForm(f => ({ ...f, bg_image: v }))} />

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">แสดงบนหน้าแรก</span>
                <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.active ? "#7c3aed" : "rgba(255,255,255,0.1)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: form.active ? "calc(100% - 18px)" : "2px" }}/>
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[rgba(124,58,237,0.15)]">
              <button onClick={closeEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-white/5 transition-colors">
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm text-white"
        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", outline:"none" }} />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-lg text-sm text-white"
        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", outline:"none" }} />
    </div>
  );
}
