"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Clock, Coins, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { createPredictionAction } from "@/lib/actions/predictions";
import { useToast } from "@/components/Toast";

const categoryOptions = [
  { label: "ดราม่า",  id: 1 },
  { label: "เกม",     id: 2 },
  { label: "กีฬา",   id: 3 },
  { label: "การเงิน", id: 4 },
  { label: "ไวรัล",  id: 5 },
  { label: "อื่นๆ",  id: 6 },
];

const durationDays: Record<string, number> = {
  "1 วัน": 1, "3 วัน": 3, "7 วัน": 7, "14 วัน": 14, "30 วัน": 30,
};

const durations = ["1 วัน", "3 วัน", "7 วัน", "14 วัน", "30 วัน"];

export default function CreatePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [categoryId, setCategoryId] = useState(1);
  const [categoryLabel, setCategoryLabel] = useState("ดราม่า");
  const [duration, setDuration] = useState("7 วัน");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState(500);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = title.length >= 10 && title.length <= 120;

  function handleSubmit() {
    if (!isValid) return;
    startTransition(async () => {
      const days = durationDays[duration] ?? 7;
      const endsAt = new Date(Date.now() + days * 86_400_000).toISOString();

      const fd = new FormData();
      fd.set("title", title);
      fd.set("description", desc);
      fd.set("category_id", String(categoryId));
      fd.set("ends_at", endsAt);
      fd.set("reward", String(reward));
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
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> ยกเลิก
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-black gradient-gold mb-1">สร้างหัวข้อทำนาย</h1>
        <p className="text-sm text-[var(--text-muted)]">ตั้งหัวข้อที่น่าสนใจ และรับพาราฯ เมื่อมีผู้เข้าร่วม</p>
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
              <button key={c.id} onClick={() => { setCategoryId(c.id); setCategoryLabel(c.label); }}
                className={`chip ${categoryLabel === c.label ? "active" : ""}`}>{c.label}</button>
            ))}
          </div>
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
            <p className="text-xs text-[var(--text-muted)]">ตั้งเป็นคำถาม ใช่/ไม่ใช่ที่ชัดเจน</p>
            <span className={`text-xs ${title.length > 100 ? "text-orange-400" : "text-[var(--text-muted)]"}`}>
              {title.length}/120
            </span>
          </div>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
              ระยะเวลาทำนาย
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60 transition-all cursor-pointer"
              >
                {durations.map((d) => <option key={d} value={d} className="bg-[#12121f]">{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
              <ImagePlus className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
              รูปภาพประกอบ
            </label>
            <label className="relative w-full h-[42px] border border-dashed border-[rgba(124,58,237,0.3)] rounded-xl text-xs text-[var(--text-muted)] hover:border-purple-500/50 hover:text-purple-400 transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-70" />
              ) : null}
              <span className="relative z-10 flex items-center gap-1">
                <ImagePlus className="w-3.5 h-3.5" />
                {imageFile ? imageFile.name.slice(0, 20) : "อัปโหลดรูปภาพ"}
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) setImagePreview(URL.createObjectURL(file));
                  else setImagePreview(null);
                }}
              />
            </label>
          </div>
        </div>

        {/* Reward */}
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">
            <Coins className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
            ตั้งรางวัล <span className="text-[var(--text-muted)] font-normal">(ไม่บังคับ)</span>
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
          <p className="text-xs text-[var(--text-muted)] mt-1">เพิ่มรางวัลเพื่อดึงดูดผู้เข้าร่วม</p>
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
  );
}
