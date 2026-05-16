"use client";
import { useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotifRow } from "./page";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

const typeColor: Record<string, string> = {
  win:     "text-green-400 bg-green-400/10",
  rank:    "text-yellow-400 bg-yellow-400/10",
  comment: "text-blue-400 bg-blue-400/10",
  mission: "text-purple-400 bg-purple-400/10",
  system:  "text-[var(--text-muted)] bg-white/5",
  vote:    "text-violet-400 bg-violet-400/10",
};

const typeIcon: Record<string, string> = {
  win:     "🏆",
  rank:    "📈",
  comment: "💬",
  mission: "⚡",
  system:  "🔔",
  vote:    "🔮",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

export default function NotificationsClient({ notifications: initial }: { notifications: NotifRow[] }) {
  const [notifs, setNotifs] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = notifs.filter((n) => !n.read).length;

  function handleMarkOne(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    startTransition(() => markNotificationRead(id));
  }

  function handleMarkAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-xl font-black gradient-gold">การแจ้งเตือน</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {unreadCount > 0 ? `${unreadCount} ใหม่` : "อ่านหมดแล้ว"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" /> อ่านทั้งหมด
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkOne(n.id)}
              className={`glass rounded-xl p-4 flex items-start gap-3 transition-all
                ${!n.read ? "border border-purple-500/30 cursor-pointer card-hover" : "border border-transparent opacity-70"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeColor[n.type] ?? "text-[var(--text-muted)] bg-white/5"}`}>
                {typeIcon[n.type] ?? "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.read ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                    {n.title}
                  </p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />}
                </div>
                {n.body && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{n.body}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-purple-600">{timeAgo(n.created_at)}</p>
                  {!!n.data?.prediction_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.read) handleMarkOne(n.id);
                        router.push(`/predict/${n.data!.prediction_id as string}`);
                      }}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                    >
                      ดูรายละเอียด →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
