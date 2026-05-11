"use client";

import { useState, useTransition } from "react";
import { Check, X, Trophy, Trash2, Pencil, ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  category_id: number | null;
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
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
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
    </div>
  );
}

/* ── Edit Modal ─────────────────────────────────────────────── */

interface EditFields {
  title: string;
  description: string;
  ends_at: string;
  category_id: number;
  is_featured: boolean;
  is_trending: boolean;
  image_url: string | null;
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
    is_featured: prediction.is_featured,
    is_trending: prediction.is_trending,
    image_url: prediction.image_url,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(prediction.image_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        is_featured: fields.is_featured,
        is_trending: fields.is_trending,
        image_url: finalImageUrl,
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
                    onClick={() => set("category_id", c.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={fields.category_id === c.id
                      ? { background: "#6F4BFF", color: "#fff" }
                      : { background: "#12101C", color: "var(--text-muted)", border: "1px solid #2A1F45" }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
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
              <label
                className="relative w-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all"
                style={{
                  height: imagePreview ? "180px" : "64px",
                  border: "1px dashed #35295A",
                  background: "#12101C",
                }}
              >
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {imageFile ? imageFile.name.slice(0, 28) : imagePreview ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : fields.image_url);
                  }}
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); set("image_url", null); }}
                  className="mt-1.5 text-xs text-[#D96B6B] hover:underline"
                >
                  ลบรูปภาพ
                </button>
              )}
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
