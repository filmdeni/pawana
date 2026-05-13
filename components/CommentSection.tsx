"use client";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Send, ThumbsUp, Loader2, MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import RankBadge from "@/components/RankBadge";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  tier: "bronze" | "silver" | "gold" | "diamond" | "legend";
  body: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  author_choice: boolean | null;
  avatar_url: string | null;
}

interface CommentSectionProps {
  predictionId: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

function CommentMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative ml-auto flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-32 rounded-xl glass border border-[rgba(124,58,237,0.25)] shadow-xl py-1 fade-in">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-purple-400" /> แก้ไข...
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> ลบ
          </button>
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ predictionId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [currentInitial, setCurrentInitial] = useState<string>("?");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newestId, setNewestId] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?prediction_id=${predictionId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
        setCurrentUserId(data.user_id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [predictionId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setCurrentUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name, username")
        .eq("id", data.user.id)
        .single();
      if (profile?.avatar_url) setCurrentAvatarUrl(profile.avatar_url);
      const name = profile?.display_name ?? profile?.username ?? "";
      if (name) setCurrentInitial(name[0]?.toUpperCase() ?? "?");
    });
    fetchComments();
  }, [fetchComments]);

  async function handleLike(id: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id !== id ? c : {
          ...c,
          liked_by_me: !c.liked_by_me,
          like_count: c.liked_by_me ? c.like_count - 1 : c.like_count + 1,
        }
      )
    );
    const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
    if (!res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id !== id ? c : {
            ...c,
            liked_by_me: !c.liked_by_me,
            like_count: c.liked_by_me ? c.like_count - 1 : c.like_count + 1,
          }
        )
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    } else {
      toastError("ลบไม่สำเร็จ");
    }
  }

  function startEdit(c: Comment) {
    setEditingId(c.id);
    setEditText(c.body);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    const res = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText.trim() }),
    });
    setIsSavingEdit(false);
    if (res.ok) {
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, body: editText.trim() } : c));
      setEditingId(null);
    } else {
      toastError("แก้ไขไม่สำเร็จ");
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prediction_id: predictionId, body: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toastError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setNewestId(data.comment.id);
      setTimeout(() => setNewestId(null), 900);
      setText("");
      success("แสดงความคิดเห็นแล้ว ✓");
    });
  }

  const displayName = (c: Comment) => c.display_name ?? c.username;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-purple-400" />
        ความคิดเห็น
        {!loading && (
          <span className="chip chip-gold">{comments.length}</span>
        )}
      </h2>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 border border-purple-500/50 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 overflow-hidden">
          {currentAvatarUrl
            ? <Image src={currentAvatarUrl} alt="avatar" width={32} height={32} className="w-full h-full object-cover" />
            : currentInitial}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentUserId ? "แสดงความคิดเห็น..." : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
            maxLength={500}
            disabled={!currentUserId || isPending}
            className="flex-1 bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim() || !currentUserId}
            className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความเห็น!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className={`flex gap-3 group ${c.id === newestId ? "comment-new" : "fade-in"}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                {c.avatar_url
                  ? <Image src={c.avatar_url} alt={displayName(c)} width={32} height={32} className="w-full h-full object-cover" />
                  : displayName(c)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{displayName(c)}</span>
                  <RankBadge tier={c.tier} />
                  {c.author_choice !== null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      c.author_choice
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}>
                      {c.author_choice ? "✓ ใช่" : "✗ ไม่ใช่"}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
                  {c.user_id === currentUserId && (
                    <CommentMenu
                      onEdit={() => startEdit(c)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  )}
                </div>

                {/* Edit mode */}
                {editingId === c.id ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={500}
                      className="flex-1 bg-white/5 border border-purple-500/50 rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-400 transition-all"
                    />
                    <button
                      onClick={() => saveEdit(c.id)}
                      disabled={isSavingEdit || !editText.trim()}
                      className="p-1.5 rounded-lg bg-purple-600/40 hover:bg-purple-600/60 text-purple-300 disabled:opacity-40 transition-all"
                    >
                      {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed break-words">{c.body}</p>
                )}

                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => handleLike(c.id)}
                    disabled={!currentUserId}
                    className={`flex items-center gap-1 text-xs transition-colors disabled:cursor-default ${
                      c.liked_by_me ? "text-purple-400" : "text-[var(--text-muted)] hover:text-purple-400"
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${c.liked_by_me ? "fill-purple-400" : ""}`} />
                    {c.like_count}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
