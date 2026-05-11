"use client";
import { useState, useRef, useTransition } from "react";
import { X, Sparkles, Save, Camera } from "lucide-react";
import Image from "next/image";
import { updateProfileAction } from "@/lib/actions/auth";

interface Props {
  displayName: string;
  avatarUrl: string | null;
  username: string;
  onClose: () => void;
  onSaved: (displayName: string, avatarUrl?: string) => void;
}

export default function EditProfileModal({ displayName, avatarUrl, username, onClose, onSaved }: Props) {
  const [name, setName] = useState(displayName);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("รูปต้องไม่เกิน 2MB"); return; }
    setPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const result = await updateProfileAction(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        onSaved(name, result.avatarUrl);
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-gold rounded-2xl border border-[rgba(124,58,237,0.4)] w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> แก้ไขโปรไฟล์
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-900 border-2 border-yellow-400/60 overflow-hidden flex items-center justify-center text-3xl font-black">
                {preview
                  ? <Image src={preview} alt="avatar" width={80} height={80} className="w-full h-full object-cover" unoptimized={preview.startsWith("blob:")} />
                  : username[0]?.toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">กดที่รูปเพื่อเปลี่ยน (JPG/PNG/WEBP ไม่เกิน 2MB)</p>
            <input
              ref={fileRef}
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">ชื่อที่แสดง</label>
            <input
              name="display_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-purple-500 bg-white/5"
              placeholder="ชื่อที่แสดง"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      </div>
    </div>
  );
}
