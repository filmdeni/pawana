"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil, X, Check, Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createHeroSlideWithPrediction } from "@/lib/actions/hero";
import ImagePositionPicker from "@/components/ImagePositionPicker";

const CATEGORY_OPTIONS = [
  { label: "ดราม่า",  id: 1 },
  { label: "เกม",     id: 2 },
  { label: "กีฬา",   id: 3 },
  { label: "การเงิน", id: 4 },
  { label: "ไวรัล",  id: 5 },
  { label: "อื่นๆ",  id: 6 },
];

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
  bg_position: string;
  active: boolean;
}

type SlideForm = Omit<HeroSlide, "id" | "sort_order">;

const EMPTY: SlideForm = {
  lines: [""],
  category: "ดราม่า",
  yes_pct: 50,
  yes_label: "เชื่อว่าใช่",
  no_label: "เชื่อว่าไม่ใช่",
  yes_btn: "ฉันว่าใช่",
  no_btn: "ฉันว่าไม่",
  duration_hours: 24,
  viewers: 1000,
  heat_level: 3,
  prediction_id: "",
  bg_image: "",
  bg_position: "50% 50%",
  active: true,
};

export default function HeroBannerClient() {
  const supabase = createClient();

  const [slides, setSlides]   = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm]       = useState<SlideForm>(EMPTY);
  const [isNew, setIsNew]     = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imgFile, setImgFile]       = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImgFile(null);
    setImgPreview(null);
  }

  function openNew() {
    setForm({ ...EMPTY });
    setEditing("__new__");
    setIsNew(true);
    setError(null);
    setImgFile(null);
    setImgPreview(null);
  }

  function closeEdit() { setEditing(null); }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imgFile) return null;
    setImgUploading(true);
    const ext = imgFile.name.split(".").pop() ?? "jpg";
    const path = `hero/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("predictions")
      .upload(path, imgFile, { contentType: imgFile.type, upsert: false });
    setImgUploading(false);
    if (error) { setError("อัปโหลดรูปไม่สำเร็จ: " + error.message); return null; }
    const { data } = supabase.storage.from("predictions").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveEdit() {
    startTransition(async () => {
      setError(null);

      let finalForm = { ...form };
      if (imgFile) {
        const url = await uploadImageIfNeeded();
        if (!url) return;
        finalForm = { ...finalForm, bg_image: url };
      }

      if (isNew) {
        const catOption = CATEGORY_OPTIONS.find(c => c.label === finalForm.category) ?? CATEGORY_OPTIONS[0];
        const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;
        const result = await createHeroSlideWithPrediction(
          { ...finalForm, category_id: catOption.id },
          maxOrder
        );
        if ("error" in result) { setError(result.error); return; }
      } else {
        const { error } = await supabase
          .from("hero_slides")
          .update(finalForm)
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

  const lineRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setLine(idx: number, val: string) {
    const lines = [...form.lines];
    lines[idx] = val;
    setForm(f => ({ ...f, lines }));
  }

  function wrapSelection(lineIdx: number, color: string) {
    const el = lineRefs.current[lineIdx];
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd   ?? 0;
    const val   = form.lines[lineIdx];
    const selected = val.slice(start, end);
    if (!selected) return;
    const tag = color === "#ff6b9d" ? `{${selected}}` : `{${selected}|${color}}`;
    const next = val.slice(0, start) + tag + val.slice(end);
    setLine(lineIdx, next);
    // restore cursor after tag
    requestAnimationFrame(() => {
      el.focus();
      const cur = start + tag.length;
      el.setSelectionRange(cur, cur);
    });
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
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "1px solid rgba(124,58,237,0.5)" }}>
            <Plus className="w-4 h-4" />
            เพิ่ม Slide
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
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
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${slide.active ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)"}`,
                opacity: slide.active ? 1 : 0.5,
              }}>

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

              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(90,50,200,0.2)", color: "#b09aff", border: "1px solid rgba(100,60,220,0.3)" }}>
                    {slide.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] truncate">
                    prediction: {slide.prediction_id.slice(0, 8)}…
                  </span>
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

              {slide.bg_image && (
                <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.bg_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}

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

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{ maxWidth: 960, maxHeight: "92vh", background: "#0f0a24", border: "1px solid rgba(124,58,237,0.35)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(124,58,237,0.15)] flex-shrink-0">
              <div>
                <h2 className="text-base font-black text-white">
                  {isNew ? "เพิ่ม Slide ใหม่" : "แก้ไข Slide"}
                </h2>
                {isNew && (
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(167,139,250,0.7)" }}>
                    ระบบจะสร้าง Prediction ให้อัตโนมัติ
                  </p>
                )}
              </div>
              <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* 2-column body */}
            <div className="flex flex-1 min-h-0 divide-x divide-[rgba(124,58,237,0.12)]">

              {/* Left: form */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}

              {/* Lines */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                  ข้อความ — เลือกคำแล้วกดสีเพื่อ highlight
                </label>
                {form.lines.map((line, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex gap-2 mb-1">
                      <input
                        ref={el => { lineRefs.current[i] = el; }}
                        value={line}
                        onChange={e => setLine(i, e.target.value)}
                        placeholder={`บรรทัดที่ ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
                      {form.lines.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }))}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                    {/* Color swatches */}
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>สี:</span>
                      {([
                        { color: "#ff6b9d", label: "ชมพู" },
                        { color: "#ffd700", label: "ทอง" },
                        { color: "#60d4f7", label: "ฟ้า" },
                        { color: "#5ED3A6", label: "เขียว" },
                      ] as const).map(({ color, label }) => (
                        <button
                          key={color}
                          type="button"
                          title={label}
                          onMouseDown={e => { e.preventDefault(); wrapSelection(i, color); }}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-125 active:scale-95"
                          style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                        />
                      ))}
                      <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                        เลือกคำ → กดสี
                      </span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, ""] }))}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> เพิ่มบรรทัด
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category dropdown */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">หมวดหมู่</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white appearance-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}>
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.id} value={c.label} style={{ background: "#0f0a24" }}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <NumberField label="ระยะเวลา (ชั่วโมง)" min={1} max={720}
                  value={form.duration_hours} onChange={v => setForm(f => ({ ...f, duration_hours: v }))} />
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
                <NumberField label="จำนวนผู้ชม (เริ่มต้น)" min={0} max={999999}
                  value={form.viewers} onChange={v => setForm(f => ({ ...f, viewers: v }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">ความร้อนแรง</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm(f => ({ ...f, heat_level: n }))}
                      className="text-xl transition-opacity"
                      style={{ opacity: n <= form.heat_level ? 1 : 0.2 }}>
                      🔥
                    </button>
                  ))}
                </div>
              </div>

              {/* Background image picker */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                  Background Image
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleImagePick} />

                {(imgPreview || form.bg_image) ? (
                  <div>
                    {/* Image with drag-to-reposition */}
                    <ImagePositionPicker
                      src={imgPreview ?? form.bg_image}
                      position={form.bg_position}
                      onChange={pos => setForm(f => ({ ...f, bg_position: pos }))}
                      onReplace={() => fileInputRef.current?.click()}
                      onRemove={() => { setImgFile(null); setImgPreview(null); setForm(f => ({ ...f, bg_image: "", bg_position: "50% 50%" })); }}
                    />
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl transition-colors"
                    style={{ height: 96, background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(124,58,237,0.35)" }}>
                    <ImagePlus className="w-6 h-6" style={{ color: "#7c3aed" }} />
                    <span className="text-xs font-semibold" style={{ color: "rgba(167,139,250,0.7)" }}>
                      คลิกเพื่อเลือกรูป
                    </span>
                  </button>
                )}
              </div>

              {/* Prediction ID — read-only for existing slides */}
              {!isNew && (
                <div className="px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Prediction ID
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                    {form.prediction_id || "—"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">แสดงบนหน้าแรก</span>
                <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.active ? "#7c3aed" : "rgba(255,255,255,0.1)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: form.active ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>

            </div>{/* end scrollable form area */}

                {/* Footer inside left column */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-[rgba(124,58,237,0.15)] flex-shrink-0">
                  <button onClick={closeEdit}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-white/5 transition-colors">
                    ยกเลิก
                  </button>
                  <button onClick={saveEdit} disabled={isPending || imgUploading}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    {(isPending || imgUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {imgUploading ? "กำลังอัปโหลด…" : isNew ? "สร้าง + บันทึก" : "บันทึก"}
                  </button>
                </div>
              </div>

              {/* Right: live preview */}
              <div className="w-80 flex-shrink-0 flex flex-col"
                style={{ background: "rgba(0,0,0,0.25)" }}>
                <div className="px-4 py-3 border-b border-[rgba(124,58,237,0.12)]">
                  <span className="text-[11px] font-black tracking-widest uppercase"
                    style={{ color: "rgba(167,139,250,0.6)" }}>Preview</span>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
                  <HeroCardPreview form={form} imgPreview={imgPreview} />
                  <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    ตัวอย่างการแสดงผลบนหน้าแรก
                  </p>
                </div>
              </div>

            </div>{/* end 2-column */}
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
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
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
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
    </div>
  );
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtMs(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function PreviewLine({ text }: { text: string }) {
  const parts = text.split(/\{([^}]+)\}/);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <span key={i}>{p}</span>;
        const pipe = p.indexOf("|");
        const label = pipe === -1 ? p : p.slice(0, pipe);
        const color = pipe === -1 ? "#ff6b9d" : p.slice(pipe + 1);
        return <span key={i} style={{ color, textShadow: `0 0 32px ${color}cc` }}>{label}</span>;
      })}
    </>
  );
}


function HeroCardPreview({ form, imgPreview }: { form: SlideForm; imgPreview: string | null }) {
  const [msLeft, setMsLeft] = useState(() => form.duration_hours * 3_600_000);
  const [yesPct, setYesPct] = useState(form.yes_pct);
  const [viewers, setViewers] = useState(form.viewers);

  useEffect(() => {
    const endsAt = Date.now() + form.duration_hours * 3_600_000;
    setMsLeft(endsAt - Date.now());
    setYesPct(form.yes_pct);
    setViewers(form.viewers);
    const iv = setInterval(() => {
      setMsLeft(endsAt - Date.now());
      setViewers(v => Math.max(100, v + Math.floor(Math.random() * 5 - 2)));
      setYesPct(p => Math.min(95, Math.max(5, p + (Math.random() > 0.5 ? 0.1 : -0.05))));
    }, 1000);
    return () => clearInterval(iv);
  }, [form.duration_hours, form.yes_pct, form.viewers]);

  const yPct  = Math.round(yesPct);
  const noPct = 100 - yPct;
  const bgSrc = imgPreview ?? (form.bg_image || null);
  const lines = form.lines.filter(Boolean);

  return (
    <div className="relative rounded-2xl overflow-hidden w-full"
      style={{ minHeight: 260 }}>

      {/* Background */}
      {bgSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={bgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: form.bg_position }} />
      ) : (
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg,#09061a 0%,#0f0a24 60%,#120d2a 100%)" }} />
      )}
      {bgSrc && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />}

      <div className="relative z-10 flex flex-col" style={{ padding: "10px 12px 10px" }}>

        {/* Badges + timer */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest"
              style={{ background: "rgba(220,30,30,0.25)", border: "1px solid rgba(220,60,60,0.6)", color: "#ff7070" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "#ff4444", boxShadow: "0 0 5px #f87171", animation: "live-pulse 1.2s ease-in-out infinite" }} />
              LIVE
            </span>
            {form.category && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: "rgba(90,50,200,0.25)", border: "1px solid rgba(100,60,220,0.4)", color: "#b09aff" }}>
                {form.category}
              </span>
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(8,5,20,0.8)", border: "1px solid rgba(220,60,40,0.5)" }}>
            <span className="font-black tabular-nums text-sm"
              style={{ color: "#FF8A65", textShadow: "0 0 12px rgba(255,138,101,0.7)", letterSpacing: "0.04em" }}>
              {fmtMs(msLeft)}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ fontSize: i < form.heat_level ? "0.7rem" : "0.55rem", opacity: i < form.heat_level ? 1 : 0.15 }}>
                  🔥
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Question lines */}
        <div className="flex flex-col mb-2" style={{ gap: "0.02em" }}>
          {lines.length > 0 ? lines.map((line, i) => (
            <div key={i} className="font-black leading-tight text-white"
              style={{ fontSize: "clamp(1rem,4vw,1.25rem)", textShadow: "0 2px 20px rgba(0,0,0,0.9)", letterSpacing: "-0.02em" }}>
              <PreviewLine text={line} />
            </div>
          )) : (
            <div className="font-black text-lg text-white/20">ข้อความจะแสดงที่นี่</div>
          )}
        </div>

        {/* Viewers */}
        <div className="flex items-center gap-1.5 mb-2 text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: "0 0 4px rgba(74,222,128,0.9)" }} />
          {viewers.toLocaleString()} คนกำลังดู
          <span style={{ color: "#FF8A65" }}>🔥 กำลังเดือด</span>
        </div>

        {/* Vote bar */}
        <div className="mb-2" style={{ width: "80%" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex flex-col items-end flex-shrink-0" style={{ minWidth: 38 }}>
              <span className="font-black leading-none text-base" style={{ color: "#5ED3A6" }}>{yPct}%</span>
              <span className="text-[8px] font-semibold" style={{ color: "#5ED3A6" }}>{form.yes_label || "YES"}</span>
            </div>
            <div className="flex flex-1 rounded-full overflow-hidden" style={{ height: 7, background: "rgba(255,255,255,0.07)" }}>
              <div className="transition-all duration-1000" style={{ width: `${yPct}%`, background: "linear-gradient(90deg,#c2185b,#ef4444)", borderRadius: "9999px 0 0 9999px" }} />
              <div className="transition-all duration-1000" style={{ width: `${noPct}%`, background: "linear-gradient(90deg,#5b21b6,#8b5cf6)", borderRadius: "0 9999px 9999px 0" }} />
            </div>
            <div className="flex flex-col items-start flex-shrink-0" style={{ minWidth: 38 }}>
              <span className="font-black leading-none text-base" style={{ color: "#a78bfa" }}>{noPct}%</span>
              <span className="text-[8px] font-semibold" style={{ color: "#a78bfa" }}>{form.no_label || "NO"}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mb-2" style={{ width: "80%" }}>
          <div className="rounded-xl py-2 text-center"
            style={{ background: "linear-gradient(135deg,rgba(185,28,28,0.70),rgba(220,38,38,0.55))", border: "1.5px solid rgba(239,68,68,0.5)" }}>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs">⚡</span>
              <span className="text-xs font-black text-white">{form.yes_btn || "YES"}</span>
            </div>
            <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>อยู่ฝั่ง YES</div>
          </div>
          <div className="rounded-xl py-2 text-center"
            style={{ background: "linear-gradient(135deg,rgba(88,28,135,0.65),rgba(109,40,217,0.50))", border: "1.5px solid rgba(139,92,246,0.5)" }}>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs">🛡️</span>
              <span className="text-xs font-black text-white">{form.no_btn || "NO"}</span>
            </div>
            <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>อยู่ฝั่ง NO</div>
          </div>
        </div>

      </div>
    </div>
  );
}
