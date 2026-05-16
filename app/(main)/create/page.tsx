"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Clock, Coins, Loader2, Plus, X as XIcon } from "lucide-react";
import Link from "next/link";
import { createPredictionAction } from "@/lib/actions/predictions";
import { useToast } from "@/components/Toast";
import ParallaxBg from "@/components/ParallaxBg";
import ImagePositionPicker from "@/components/ImagePositionPicker";

const categoryOptions = [
  { label: "ดราม่า",  id: 1 },
  { label: "เกม",     id: 2 },
  { label: "กีฬา",   id: 3 },
  { label: "การเงิน", id: 4 },
  { label: "ไวรัล",  id: 5 },
  { label: "อื่นๆ",  id: 6 },
];

const subcategoryMap: Record<number, string[]> = {
  3: ["มวย", "ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล", "อีสปอร์ต", "อื่นๆ"],
  2: ["PC", "มือถือ", "คอนโซล"],
};

const DURATION_PRESETS = [
  {
    group: "⚡ Quick",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "#fb923c",
    items: [
      { label: "5 นาที",  minutes: 5 },
      { label: "15 นาที", minutes: 15 },
      { label: "30 นาที", minutes: 30 },
    ],
  },
  {
    group: "🔥 Hot",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.12)",
    border: "#f43f5e",
    items: [
      { label: "1 ชั่วโมง", minutes: 60 },
      { label: "3 ชั่วโมง", minutes: 180 },
      { label: "6 ชั่วโมง", minutes: 360 },
    ],
  },
  {
    group: "📅 Daily",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    border: "#818cf8",
    items: [
      { label: "24 ชั่วโมง", minutes: 1440 },
      { label: "3 วัน",      minutes: 4320 },
    ],
  },
  {
    group: "🏆 Long",
    color: "#D7B56D",
    bg: "rgba(215,181,109,0.10)",
    border: "#D7B56D",
    items: [
      { label: "7 วัน",  minutes: 10080 },
      { label: "30 วัน", minutes: 43200 },
    ],
  },
];

export default function CreatePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [categoryId, setCategoryId] = useState(1);
  const [categoryLabel, setCategoryLabel] = useState("ดราม่า");
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(10080);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState(500);
  const [options, setOptions] = useState<string[]>(["ใช่", "ไม่ใช่"]);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState("50% 50%");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid = title.length >= 10 && title.length <= 120;

  function handleSubmit() {
    if (!isValid) return;
    startTransition(async () => {
      const endsAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();

      const fd = new FormData();
      fd.set("title", title);
      fd.set("description", desc);
      fd.set("category_id", String(categoryId));
      fd.set("ends_at", endsAt);
      fd.set("max_bet", String(reward));
      fd.set("image_position", imagePosition);
      fd.set("options", JSON.stringify(options.filter(o => o.trim())));
      if (subcategory) fd.set("subcategory", subcategory);
      if (imageFile) fd.set("image", imageFile);

      const result = await createPredictionAction(fd);
      if ("error" in result) {
        toastError("สร้างไม่สำเร็จ", result.error);
      } else {
        success("สร้างหัวข้อสำเร็จ! 🔮", "หัวข้อของคุณถูกเพิ่มแล้ว");
        router.push("/predict");
      }
    });
  }

  return (
    <div className="relative">
      <ParallaxBg variant="gold" />
    <div className="relative p-4 md:p-6 max-w-2xl mx-auto" style={{ zIndex: 1 }}>
      <Link href="/" className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> ยกเลิก
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-black gradient-gold mb-1">สร้างหัวข้อทำนาย</h1>
        <p className="text-sm text-[var(--text-muted)]">ตั้งหัวข้อที่น่าสนใจ และรับญาณฯ เมื่อมีผู้เข้าร่วม</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step >= s ? "bg-purple-600 text-white glow-purple" : "glass text-[var(--text-muted)]"}`}>
              {s}
            </div>
            <span className="text-xs text-[var(--text-muted)] hidden sm:block">
              {s === 1 ? "หัวข้อ" : s === 2 ? "รายละเอียด" : "ตั้งรางวัล"}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? "bg-purple-600" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Category */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            เลือกหมวดหมู่ <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button key={c.id} onClick={() => { setCategoryId(c.id); setCategoryLabel(c.label); setSubcategory(null); }}
                className={`chip ${categoryLabel === c.label ? "active" : ""}`}>{c.label}</button>
            ))}
          </div>
          {subcategoryMap[categoryId] && (
            <div className="mt-3">
              <p className="text-xs text-[var(--text-muted)] mb-2">ประเภทย่อย</p>
              <div className="flex flex-wrap gap-2">
                {subcategoryMap[categoryId].map((s) => (
                  <button key={s} type="button" onClick={() => setSubcategory(subcategory === s ? null : s)}
                    className={`chip ${subcategory === s ? "active" : ""}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            หัวข้อทำนาย <span className="text-red-400">*</span>
          </label>
          <textarea
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (step < 2 && e.target.value.length >= 10) setStep(2); }}
            maxLength={120}
            rows={3}
            placeholder="พิมพ์คำถามเพื่อให้ผู้คนทำนาย..."
            className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all resize-none"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-[var(--text-muted)]">ตั้งเป็นคำถามที่ชัดเจน</p>
            <span className={`text-xs ${title.length > 100 ? "text-orange-400" : "text-[var(--text-muted)]"}`}>
              {title.length}/120
            </span>
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            ตัวเลือก <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)] flex-shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  maxLength={40}
                  placeholder={`ตัวเลือกที่ ${i + 1}`}
                  className="flex-1 bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 5 && (
            <button
              type="button"
              onClick={() => setOptions([...options, ""])}
              className="mt-2 flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> เพิ่มตัวเลือก
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            รายละเอียด <span className="text-[var(--text-muted)] font-normal">(ไม่บังคับ)</span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="อธิบายเพิ่มเติมเกี่ยวกับหัวข้อทำนาย..."
            className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all resize-none"
          />
          <p className="text-right text-xs text-[var(--text-muted)] mt-1">{desc.length}/500</p>
        </div>

        {/* Duration + Image row */}
        <div className="grid grid-cols-1 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
              ระยะเวลาทำนาย
            </label>
            <div className="space-y-2">
              {DURATION_PRESETS.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-bold mb-1.5" style={{ color: group.color }}>{group.group}</p>
                  <div className={`grid gap-1.5 ${group.items.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {group.items.map((item) => {
                      const isActive = durationMinutes === item.minutes;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setDurationMinutes(item.minutes)}
                          className="py-2 rounded-xl text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                          style={isActive
                            ? { background: group.bg, border: `1px solid ${group.border}`, color: group.color }
                            : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--text-muted)" }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
              <ImagePlus className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
              รูปภาพประกอบ
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                setImagePosition("50% 50%");
                if (file) setImagePreview(URL.createObjectURL(file));
                else setImagePreview(null);
              }}
            />
            {imagePreview ? (
              <ImagePositionPicker
                src={imagePreview}
                position={imagePosition}
                height={180}
                onChange={setImagePosition}
                onReplace={() => fileInputRef.current?.click()}
                onRemove={() => { setImageFile(null); setImagePreview(null); setImagePosition("50% 50%"); }}
              />
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl transition-colors text-sm"
                style={{ height: 48, border: "1.5px dashed rgba(124,58,237,0.35)", color: "rgba(167,139,250,0.7)" }}>
                <ImagePlus className="w-4 h-4" /> อัปโหลดรูปภาพ
              </button>
            )}
          </div>
        </div>

        {/* Reward */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            <Coins className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
            ญาณสูงสุดต่อการทาย
          </label>
          <div className="flex gap-2 mb-2">
            {[100, 500, 1000, 2000].map((v) => (
              <button key={v} onClick={() => { setReward(v); if (step < 3) setStep(3); }}
                className={`chip flex-1 py-2 text-center ${reward === v ? "active" : ""}`}>
                {v.toLocaleString()}
              </button>
            ))}
          </div>
          <input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} min={0}
            className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60 transition-all" />
          <p className="text-xs text-[var(--text-muted)] mt-1">จำกัดจำนวนญาณสูงสุดที่ผู้เล่นแต่ละคนสามารถทายได้</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/" className="flex-1 py-3 rounded-xl border border-[rgba(124,58,237,0.3)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 text-center transition-all">
            ยกเลิก
          </Link>
          <div className="flex-1 flex flex-col gap-1">
            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-purple flex items-center justify-center gap-2"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้าง...</> : "สร้างหัวข้อ"}
            </button>
            {title.length > 0 && title.length < 10 && (
              <p className="text-xs text-red-400 text-center">หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร ({title.length}/10)</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
