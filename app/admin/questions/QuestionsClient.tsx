"use client";

import { useState, useTransition, useRef } from "react";
import { Check, X, Trophy, Trash2, Pencil, ImagePlus, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImagePositionPicker from "@/components/ImagePositionPicker";

type Status = "pending" | "approved" | "rejected";

interface Prediction {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  resolution: boolean | null;
  yes_pool: number;
  no_pool: number;
  participant_count: number;
  ends_at: string;
  created_at: string;
  is_featured: boolean;
  is_trending: boolean;
  image_url: string | null;
  image_position: string | null;
  category_id: number | null;
  subcategory: string | null;
  yes_label: string | null;
  no_label: string | null;
  profiles: { username: string }[] | null;
}

type FilterType = "all" | "pending" | "approved" | "rejected" | "resolved";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "ทั้งหมด",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  resolved: "เฉลยแล้ว",
};

const CATEGORIES = [
  { label: "ดราม่า",  id: 1 },
  { label: "เกม",     id: 2 },
  { label: "กีฬา",   id: 3 },
  { label: "การเงิน", id: 4 },
  { label: "ไวรัล",  id: 5 },
  { label: "อื่นๆ",  id: 6 },
];

export default function QuestionsClient({ predictions: initial }: { predictions: Prediction[] }) {
  const [predictions, setPredictions] = useState(initial);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Prediction | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function callAction(id: string, action: string, body?: object) {
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function updateLocal(id: string, patch: Partial<Prediction>) {
    setPredictions(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  function removeLocal(id: string) {
    setPredictions(prev => prev.filter(p => p.id !== id));
  }

  function handle(id: string, fn: () => Promise<void>) {
    startTransition(async () => {
      try { await fn(); } catch (e) { alert(String(e)); }
    });
  }

  const filtered = predictions.filter(p => {
    if (filter === "resolved") return p.resolution !== null;
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={filter === f
              ? { background: "#6F4BFF", color: "#fff" }
              : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
          >
            {FILTER_LABELS[f]}
            <span className="ml-1.5 opacity-60 text-xs">
              {f === "all" ? predictions.length
                : f === "resolved" ? predictions.filter(p => p.resolution !== null).length
                : predictions.filter(p => p.status === f).length}
            </span>
          </button>
        ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#6F4BFF,#7B61FF)", border: "1px solid rgba(111,75,255,0.5)" }}
        >
          <Plus className="w-4 h-4" />
          สร้าง Prediction
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A1F45] text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)]">คำถาม</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">โดย</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">ผู้ร่วม</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">สถานะ</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1535]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-muted)]">ไม่มีรายการ</td>
                </tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-medium text-[var(--text-primary)] leading-snug line-clamp-2">{p.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {new Date(p.created_at).toLocaleDateString("th-TH")} · สิ้นสุด {new Date(p.ends_at).toLocaleDateString("th-TH")}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                    {p.profiles?.[0]?.username ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                    {p.participant_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={p.status} resolution={p.resolution} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Edit */}
                      <ActionButton
                        label="แก้ไข"
                        color="#88eeff"
                        icon={<Pencil className="w-3.5 h-3.5" />}
                        disabled={isPending}
                        onClick={() => setEditTarget(p)}
                      />
                      {/* Approve */}
                      {p.status !== "approved" && p.resolution === null && (
                        <ActionButton
                          label="อนุมัติ"
                          color="#5ED3A6"
                          icon={<Check className="w-3.5 h-3.5" />}
                          disabled={isPending}
                          onClick={() => handle(p.id, async () => {
                            await callAction(p.id, "approve");
                            updateLocal(p.id, { status: "approved" });
                          })}
                        />
                      )}
                      {/* Reject */}
                      {p.status !== "rejected" && p.resolution === null && (
                        <ActionButton
                          label="ปฏิเสธ"
                          color="#D96B6B"
                          icon={<X className="w-3.5 h-3.5" />}
                          disabled={isPending}
                          onClick={() => handle(p.id, async () => {
                            await callAction(p.id, "reject");
                            updateLocal(p.id, { status: "rejected" });
                          })}
                        />
                      )}
                      {/* Resolve */}
                      {p.resolution === null && (
                        resolveId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={isPending}
                              onClick={() => handle(p.id, async () => {
                                await callAction(p.id, "resolve", { resolution: true });
                                updateLocal(p.id, { resolution: true });
                                setResolveId(null);
                              })}
                              className="text-xs px-2 py-1 rounded-lg font-semibold transition-all"
                              style={{ background: "#5ED3A622", color: "#5ED3A6" }}
                            >YES ✓</button>
                            <button
                              disabled={isPending}
                              onClick={() => handle(p.id, async () => {
                                await callAction(p.id, "resolve", { resolution: false });
                                updateLocal(p.id, { resolution: false });
                                setResolveId(null);
                              })}
                              className="text-xs px-2 py-1 rounded-lg font-semibold transition-all"
                              style={{ background: "#D96B6B22", color: "#D96B6B" }}
                            >NO ✗</button>
                            <button onClick={() => setResolveId(null)} className="text-xs text-[var(--text-muted)] px-1">ยกเลิก</button>
                          </div>
                        ) : (
                          <ActionButton
                            label="เฉลย"
                            color="#D7B56D"
                            icon={<Trophy className="w-3.5 h-3.5" />}
                            disabled={isPending}
                            onClick={() => setResolveId(p.id)}
                          />
                        )
                      )}
                      {/* Delete */}
                      <ActionButton
                        label="ลบ"
                        color="#D96B6B"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        disabled={isPending}
                        onClick={() => {
                          if (!confirm(`ลบ "${p.title}" ?\nการลบจะไม่สามารถยกเลิกได้`)) return;
                          handle(p.id, async () => {
                            await fetch(`/api/admin/questions/${p.id}`, { method: "DELETE" });
                            removeLocal(p.id);
                          });
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <EditModal
          prediction={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(id, patch) => {
            updateLocal(id, patch as Partial<Prediction>);
            setEditTarget(null);
          }}
        />
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setPredictions(prev => [p, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Create Modal ───────────────────────────────────────────── */

const SUBCATEGORY_MAP: Record<number, string[]> = {
  3: ["มวย", "ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล", "อีสปอร์ต", "อื่นๆ"],
  2: ["PC", "มือถือ", "คอนโซล"],
};

const CAT_CONFIG: Record<string, { bg: string; pill: string; accent: string }> = {
  ดราม่า:  { bg: "from-rose-950 via-pink-900 to-rose-950",       pill: "rgba(244,63,94,0.85)",  accent: "#f43f5e" },
  เกม:     { bg: "from-indigo-950 via-violet-900 to-indigo-950", pill: "rgba(99,102,241,0.85)", accent: "#818cf8" },
  กีฬา:   { bg: "from-green-950 via-emerald-900 to-green-950",  pill: "rgba(22,163,74,0.85)",  accent: "#4ade80" },
  การเงิน: { bg: "from-yellow-950 via-amber-900 to-yellow-950",  pill: "rgba(202,138,4,0.85)",  accent: "#fbbf24" },
  ไวรัล:  { bg: "from-orange-950 via-red-900 to-orange-950",    pill: "rgba(234,88,12,0.85)",  accent: "#fb923c" },
  อื่นๆ:   { bg: "from-purple-950 via-violet-900 to-purple-950", pill: "rgba(111,75,255,0.85)", accent: "#a78bfa" },
};

interface CreateFields {
  title: string;
  description: string;
  ends_at: string;
  category_id: number;
  subcategory: string | null;
  is_featured: boolean;
  is_trending: boolean;
  yes_label: string;
  no_label: string;
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Prediction) => void;
}) {
  const defaultEndsAt = () => {
    const d = new Date(Date.now() + 24 * 3_600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [fields, setFields] = useState<CreateFields>({
    title: "",
    description: "",
    ends_at: defaultEndsAt(),
    category_id: 1,
    subcategory: null,
    is_featured: false,
    is_trending: false,
    yes_label: "ใช่",
    no_label: "ไม่ใช่",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState("50% 50%");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"card" | "detail">("card");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof CreateFields>(k: K, v: CreateFields[K]) {
    setFields(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.title.length < 10) { setError("หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร"); return; }
    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `admin/new-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("predictions")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ: " + uploadError.message);
        const { data } = supabase.storage.from("predictions").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ends_at: new Date(fields.ends_at).toISOString(),
          image_url: imageUrl,
          image_position: imagePosition,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error ?? res.statusText);
      }
      const created = await res.json() as Prediction;
      onCreated(created);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const catLabel = CATEGORIES.find(c => c.id === fields.category_id)?.label ?? "อื่นๆ";
  const cat = CAT_CONFIG[catLabel] ?? CAT_CONFIG["อื่นๆ"];
  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#6F4BFF] transition-all resize-none";
  const inputStyle = { background: "#12101C", border: "1px solid #2A1F45" };

  const endsAtDate = fields.ends_at ? new Date(fields.ends_at) : new Date(Date.now() + 86400000);
  const diff = endsAtDate.getTime() - Date.now();
  const daysLeft = Math.ceil(diff / 86_400_000);
  const hoursLeft = Math.ceil(diff / 3_600_000);
  const timeLeft = daysLeft > 1 ? `${daysLeft} วัน` : hoursLeft > 0 ? `${hoursLeft} ชั่วโมง` : "หมดเวลา";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,6,10,0.80)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass rounded-2xl w-full flex overflow-hidden"
        style={{ maxWidth: 960, maxHeight: "92vh", border: "1px solid #35295A" }}>

        {/* Left: form */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A1F45] flex-shrink-0">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">สร้าง Prediction ใหม่</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => { set("category_id", c.id); set("subcategory", null); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={fields.category_id === c.id
                        ? { background: "#6F4BFF", color: "#fff" }
                        : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {SUBCATEGORY_MAP[fields.category_id] && (
                  <div className="mt-3">
                    <p className="text-xs text-[var(--text-muted)] mb-2">ประเภทย่อย</p>
                    <div className="flex flex-wrap gap-2">
                      {SUBCATEGORY_MAP[fields.category_id].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => set("subcategory", fields.subcategory === s ? null : s)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                          style={fields.subcategory === s
                            ? { background: "#6F4BFF", color: "#fff" }
                            : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  หัวข้อคำถาม <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={120}
                  value={fields.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="เช่น ทีมไทยจะผ่านรอบแรกฟุตบอลโลกได้ไหม?"
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-right text-xs text-[var(--text-muted)] mt-1">{fields.title.length}/120</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  คำอธิบาย <span className="text-[var(--text-muted)] font-normal">(ไม่บังคับ)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={fields.description}
                  onChange={e => set("description", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  <ImagePlus className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                  รูปภาพประกอบ
                </label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    setImagePosition("50% 50%");
                    setImagePreview(file ? URL.createObjectURL(file) : null);
                  }} />
                {imagePreview ? (
                  <ImagePositionPicker
                    src={imagePreview}
                    position={imagePosition}
                    height={160}
                    onChange={setImagePosition}
                    onReplace={() => fileInputRef.current?.click()}
                    onRemove={() => { setImageFile(null); setImagePreview(null); setImagePosition("50% 50%"); }}
                  />
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl text-xs transition-all"
                    style={{ height: 64, border: "1px dashed #35295A", background: "#12101C", color: "var(--text-muted)" }}>
                    <ImagePlus className="w-3.5 h-3.5" /> คลิกเพื่ออัปโหลดรูปภาพ
                  </button>
                )}
              </div>

              {/* Yes / No labels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                    ปุ่ม <span style={{ color: "#5ED3A6" }}>ใช่</span>
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={fields.yes_label}
                    onChange={e => set("yes_label", e.target.value)}
                    placeholder="ใช่"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                    ปุ่ม <span style={{ color: "#D96B6B" }}>ไม่ใช่</span>
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={fields.no_label}
                    onChange={e => set("no_label", e.target.value)}
                    placeholder="ไม่ใช่"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">วันสิ้นสุด</label>
                <input
                  type="datetime-local"
                  required
                  value={fields.ends_at}
                  onChange={e => set("ends_at", e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>

              <div className="flex items-center gap-8">
                <Toggle label="Featured (โปรโมท)" checked={fields.is_featured} onChange={v => set("is_featured", v)} color="#D7B56D" />
                <Toggle label="Trending (กำลังมาแรง)" checked={fields.is_trending} onChange={v => set("is_trending", v)} color="#88eeff" />
              </div>

              {error && <p className="text-xs text-[#D96B6B]">{error}</p>}
            </div>

            <div className="px-6 pb-5 pt-4 flex justify-end gap-2 border-t border-[#2A1F45] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                style={{ background: "#12101C", border: "1px solid #2A1F45" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #6F4BFF, #7B61FF)" }}
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "กำลังสร้าง…" : "สร้าง Prediction"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: preview */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-[#2A1F45]"
          style={{ background: "rgba(0,0,0,0.25)" }}>
          {/* Tab switcher */}
          <div className="flex border-b border-[#2A1F45] flex-shrink-0">
            {(["card", "detail"] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className="flex-1 py-3 text-[11px] font-bold tracking-wide transition-colors"
                style={previewTab === tab
                  ? { color: "#a78bfa", borderBottom: "2px solid #6F4BFF" }
                  : { color: "rgba(255,255,255,0.3)" }}
              >
                {tab === "card" ? "การ์ด (Grid)" : "หน้า Detail"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {previewTab === "card" ? (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(167,139,250,0.5)" }}>
                  ตัวอย่างบนหน้า /predict
                </p>
                {/* Card preview */}
                <div className="glass rounded-2xl overflow-hidden">
                  {/* Thumbnail */}
                  <div className={`relative h-36 bg-gradient-to-br ${cat.bg} flex items-center justify-center overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg,transparent,${cat.accent},transparent)` }} />
                    {imagePreview
                      ? <img src={imagePreview} alt="" className="w-full h-full object-cover" style={{ objectPosition: imagePosition }} /> // eslint-disable-line @next/next/no-img-element
                      : <span className="text-5xl opacity-40">🔮</span>
                    }
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
                      style={{ background: cat.pill }}>{catLabel}</span>
                    {fields.is_featured && (
                      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
                        style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        LIVE
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0e0e1a] to-transparent" />
                  </div>
                  {/* Body */}
                  <div className="p-3.5 space-y-2.5">
                    <h3 className="text-sm font-black text-white leading-snug line-clamp-2">
                      {fields.title || "หัวข้อคำถามจะแสดงที่นี่"}
                    </h3>
                    <div>
                      <div className="flex rounded-full overflow-hidden h-2 mb-1.5 gap-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="rounded-l-full" style={{ width: "60%", background: "linear-gradient(90deg,#c2185b,#ef4444)" }} />
                        <div className="rounded-r-full" style={{ width: "40%", background: "linear-gradient(90deg,#5b21b6,#8b5cf6)" }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-black">
                        <span className="text-[#5ED3A6]">✓ ใช่ 60%</span>
                        <span className="text-[#D96B6B]">✗ ไม่ใช่ 40%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-xl py-2 text-xs font-bold text-center text-white"
                        style={{ background: "rgba(185,28,28,0.4)", border: "1px solid rgba(239,68,68,0.3)" }}>✓ ใช่</div>
                      <div className="rounded-xl py-2 text-xs font-bold text-center text-white"
                        style={{ background: "rgba(88,28,135,0.4)", border: "1px solid rgba(139,92,246,0.3)" }}>✗ ไม่ใช่</div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>🔥 1,000 คน</span>
                      <span>⏱ {timeLeft}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(167,139,250,0.5)" }}>
                  ตัวอย่างหน้า /predict/[id]
                </p>
                {/* Detail header preview */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "#0e0e1a", border: "1px solid #2A1F45" }}>
                  {/* image + title row */}
                  <div className="p-4 flex gap-3">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="" className="w-full h-full object-cover" style={{ objectPosition: imagePosition }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,transparent,#0e0e1a 90%)" }} />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
                        style={{ background: "#1a1528", border: "1px dashed #35295A" }}>🔮</div>
                    )}
                    <div className="flex flex-col justify-center gap-1.5 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full w-fit font-bold"
                        style={{ background: cat.pill + "33", color: cat.accent, border: `1px solid ${cat.accent}44` }}>
                        {catLabel}
                      </span>
                      <p className="text-sm font-black text-white leading-snug line-clamp-3">
                        {fields.title || "หัวข้อคำถามจะแสดงที่นี่"}
                      </p>
                    </div>
                  </div>
                  {/* description */}
                  {fields.description && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">{fields.description}</p>
                    </div>
                  )}
                  {/* stats row */}
                  <div className="px-4 pb-4 flex gap-4 text-[11px]">
                    <div className="flex flex-col">
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>สิ้นสุด</span>
                      <span className="font-semibold text-white">{timeLeft}</span>
                    </div>
                    <div className="flex flex-col">
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>ผู้ร่วม</span>
                      <span className="font-semibold text-white">1,000</span>
                    </div>
                    {fields.is_featured && (
                      <div className="flex flex-col">
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>สถานะ</span>
                        <span className="font-semibold" style={{ color: "#f87171" }}>🔴 LIVE</span>
                      </div>
                    )}
                  </div>
                  {/* vote bar */}
                  <div className="px-4 pb-4">
                    <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5 mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="rounded-l-full" style={{ width: "60%", background: "linear-gradient(90deg,#c2185b,#ef4444)" }} />
                      <div className="rounded-r-full" style={{ width: "40%", background: "linear-gradient(90deg,#5b21b6,#8b5cf6)" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl py-2.5 text-center text-xs font-black text-white"
                        style={{ background: "linear-gradient(135deg,rgba(185,28,28,0.6),rgba(220,38,38,0.45))", border: "1px solid rgba(239,68,68,0.4)" }}>
                        ✓ ใช่
                      </div>
                      <div className="rounded-xl py-2.5 text-center text-xs font-black text-white"
                        style={{ background: "linear-gradient(135deg,rgba(88,28,135,0.6),rgba(109,40,217,0.45))", border: "1px solid rgba(139,92,246,0.4)" }}>
                        ✗ ไม่ใช่
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Edit Modal ─────────────────────────────────────────────── */

interface EditFields {
  title: string;
  description: string;
  ends_at: string;
  category_id: number;
  subcategory: string | null;
  is_featured: boolean;
  is_trending: boolean;
  image_url: string | null;
  image_position: string;
  yes_label: string;
  no_label: string;
}

function EditModal({
  prediction,
  onClose,
  onSaved,
}: {
  prediction: Prediction;
  onClose: () => void;
  onSaved: (id: string, patch: Partial<Prediction>) => void;
}) {
  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [fields, setFields] = useState<EditFields>({
    title: prediction.title,
    description: prediction.description ?? "",
    ends_at: toLocalDatetime(prediction.ends_at),
    category_id: prediction.category_id ?? 1,
    subcategory: prediction.subcategory ?? null,
    is_featured: prediction.is_featured,
    is_trending: prediction.is_trending,
    image_url: prediction.image_url,
    image_position: prediction.image_position ?? "50% 50%",
    yes_label: prediction.yes_label ?? "ใช่",
    no_label: prediction.no_label ?? "ไม่ใช่",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(prediction.image_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof EditFields>(k: K, v: EditFields[K]) {
    setFields(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.title.length < 10) { setError("หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร"); return; }
    setSaving(true);
    setError(null);

    try {
      let finalImageUrl = fields.image_url;

      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `admin/${prediction.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("predictions")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: true });
        if (uploadError) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ: " + uploadError.message);
        const { data } = supabase.storage.from("predictions").getPublicUrl(path);
        finalImageUrl = data.publicUrl;
      }

      const payload = {
        title: fields.title,
        description: fields.description,
        ends_at: new Date(fields.ends_at).toISOString(),
        category_id: fields.category_id,
        subcategory: fields.subcategory,
        is_featured: fields.is_featured,
        is_trending: fields.is_trending,
        image_url: finalImageUrl,
        image_position: fields.image_position,
        yes_label: fields.yes_label,
        no_label: fields.no_label,
      };

      const res = await fetch(`/api/admin/questions/${prediction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", fields: payload }),
      });
      if (!res.ok) throw new Error(await res.text());

      onSaved(prediction.id, { ...payload } as Partial<Prediction>);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#6F4BFF] transition-all resize-none";
  const inputStyle = { background: "#12101C", border: "1px solid #2A1F45" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,6,10,0.80)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" style={{ border: "1px solid #35295A" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A1F45] flex-shrink-0">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">แก้ไขคำถาม</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">หมวดหมู่</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => { set("category_id", c.id); set("subcategory", null); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={fields.category_id === c.id
                      ? { background: "#6F4BFF", color: "#fff" }
                      : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {SUBCATEGORY_MAP[fields.category_id] && (
                <div className="mt-3">
                  <p className="text-xs text-[var(--text-muted)] mb-2">ประเภทย่อย</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBCATEGORY_MAP[fields.category_id].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => set("subcategory", fields.subcategory === s ? null : s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={fields.subcategory === s
                          ? { background: "#6F4BFF", color: "#fff" }
                          : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                หัวข้อคำถาม <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                maxLength={120}
                value={fields.title}
                onChange={e => set("title", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <p className="text-right text-xs text-[var(--text-muted)] mt-1">{fields.title.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                คำอธิบาย <span className="text-[var(--text-muted)] font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={fields.description}
                onChange={e => set("description", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <p className="text-right text-xs text-[var(--text-muted)] mt-1">{fields.description.length}/500</p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                <ImagePlus className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                รูปภาพประกอบ
              </label>
              <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  set("image_position", "50% 50%");
                  setImagePreview(file ? URL.createObjectURL(file) : fields.image_url);
                }} />
              {imagePreview ? (
                <ImagePositionPicker
                  src={imagePreview}
                  position={fields.image_position}
                  height={180}
                  onChange={pos => set("image_position", pos)}
                  onReplace={() => editFileRef.current?.click()}
                  onRemove={() => { setImageFile(null); setImagePreview(null); set("image_url", null); set("image_position", "50% 50%"); }}
                />
              ) : (
                <button type="button" onClick={() => editFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl text-xs transition-all"
                  style={{ height: 64, border: "1px dashed #35295A", background: "#12101C", color: "var(--text-muted)" }}>
                  <ImagePlus className="w-3.5 h-3.5" /> อัปโหลดรูปภาพ
                </button>
              )}
            </div>

            {/* Yes / No labels */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  ปุ่ม <span style={{ color: "#5ED3A6" }}>ใช่</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={fields.yes_label}
                  onChange={e => set("yes_label", e.target.value)}
                  placeholder="ใช่"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  ปุ่ม <span style={{ color: "#D96B6B" }}>ไม่ใช่</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={fields.no_label}
                  onChange={e => set("no_label", e.target.value)}
                  placeholder="ไม่ใช่"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Ends at */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">วันสิ้นสุด</label>
              <input
                type="datetime-local"
                required
                value={fields.ends_at}
                onChange={e => set("ends_at", e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
              <Toggle
                label="Featured (โปรโมท)"
                checked={fields.is_featured}
                onChange={v => set("is_featured", v)}
                color="#D7B56D"
              />
              <Toggle
                label="Trending (กำลังมาแรง)"
                checked={fields.is_trending}
                onChange={v => set("is_trending", v)}
                color="#88eeff"
              />
            </div>

            {error && <p className="text-xs text-[#D96B6B]">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              style={{ background: "#12101C", border: "1px solid #2A1F45" }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #6F4BFF, #7B61FF)" }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────── */

function Toggle({ label, checked, onChange, color }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; color: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
        style={{ background: checked ? color : "#2A1F45" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}

/* ── Shared ─────────────────────────────────────────────────── */

function ActionButton({
  label, color, icon, disabled, onClick,
}: {
  label: string; color: string; icon: React.ReactNode; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
      style={{ background: `${color}18`, color }}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function StatusBadge({ status, resolution }: { status: Status; resolution: boolean | null }) {
  if (resolution !== null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: "#5ED3A622", color: "#5ED3A6" }}>
        เฉลยแล้ว {resolution ? "✓ YES" : "✗ NO"}
      </span>
    );
  }
  const map: Record<Status, { bg: string; text: string; label: string }> = {
    pending:  { bg: "#FFB86B22", text: "#FFB86B", label: "รออนุมัติ" },
    approved: { bg: "#6F4BFF22", text: "#7B61FF", label: "อนุมัติ" },
    rejected: { bg: "#D96B6B22", text: "#D96B6B", label: "ปฏิเสธ" },
  };
  const s = map[status];
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}
