"use client";
import { useState } from "react";
import Image from "next/image";
import { Bell, Edit3, Trophy, Target } from "lucide-react";
import Link from "next/link";
import RankBadge from "@/components/RankBadge";
import XPBar from "@/components/XPBar";
import { VoteHistoryRow } from "@/lib/queries/predictions";
import EditProfileModal from "./EditProfileModal";


interface Props {
  isOwner: boolean;
  username: string;
  displayName: string;
  title: string;
  avatarUrl: string | null;
  coins: number;
  xp: number;
  level: number;
  rankPosition: number | null;
  totalPredictions: number;
  correctPredictions: number;
  streak: number;
  tier: "bronze" | "silver" | "gold" | "diamond" | "legend";
  voteHistory: VoteHistoryRow[];
}

export default function ProfileClient({
  isOwner,
  username,
  displayName,
  title,
  avatarUrl,
  coins,
  xp,
  level,
  rankPosition,
  totalPredictions,
  correctPredictions,
  streak,
  tier,
  voteHistory,
}: Props) {
  const [tab, setTab] = useState<"history" | "badges" | "stats">("history");
  const [editOpen, setEditOpen] = useState(false);
  const [localUsername, setLocalUsername] = useState(username);
  const [localTitle, setLocalTitle] = useState(title);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl);

  const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
  const wrongCount = Math.max(0, totalPredictions - correctPredictions - Math.round(totalPredictions * 0.07));
  const pendingCount = Math.max(0, totalPredictions - correctPredictions - wrongCount);

  const badges = [
    { icon: "🔮", label: "จักรวาลแห่งผู้มองเห็น", desc: "ทำนายถูก 100 ครั้ง",      unlocked: correctPredictions >= 100 },
    { icon: "⚡", label: "นักพยากรณ์มือเร็ว",      desc: "ทำนาย 10 ครั้งขึ้นไป",   unlocked: totalPredictions >= 10 },
    { icon: "🎯", label: "เข้าเป้าเสมอ",            desc: "ความแม่น 80%+",          unlocked: accuracy >= 80 && totalPredictions >= 10 },
    { icon: "🏆", label: "เจ้าแห่งอันดับ",           desc: "ติด Top 10",             unlocked: rankPosition != null && rankPosition <= 10 },
    { icon: "🌙", label: "จิตใจแห่งดวงจันทร์",      desc: "สตรีค 30 วัน",           unlocked: streak >= 30 },
    { icon: "👑", label: "ราชาแห่งคำทำนาย",         desc: "อันดับ 1 ประจำปี",       unlocked: rankPosition === 1 },
  ];

  return (
    <>
      {editOpen && (
        <EditProfileModal
          username={localUsername}
          displayName={displayName}
          avatarUrl={localAvatarUrl}
          onClose={() => setEditOpen(false)}
          onSaved={(name, url) => { setLocalUsername(name); if (url) setLocalAvatarUrl(url); }}
        />
      )}

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-5">
        {/* Profile Hero */}
        <div className="glass-gold rounded-2xl p-4 md:p-6 relative overflow-hidden border border-[rgba(124,58,237,0.3)]">
          <div className="absolute inset-0 cosmic-bg opacity-40" />
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-purple-600/15 blur-3xl" />

          <div className="relative z-10 flex items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-900 border-2 border-yellow-400/60 flex items-center justify-center text-3xl font-black glow-gold overflow-hidden">
                {localAvatarUrl ? (
                  <Image src={localAvatarUrl} alt={localUsername} width={80} height={80} className="w-full h-full object-cover" unoptimized={localAvatarUrl.includes("?t=")} />
                ) : (
                  localUsername[0]?.toUpperCase()
                )}
              </div>
              <div className="absolute -inset-2 rounded-full border border-yellow-400/20 aura-ring" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-[var(--bg-base)]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                    {localUsername}
                    {isOwner && (
                      <button onClick={() => setEditOpen(true)} className="w-6 h-6 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors">
                        <Edit3 className="w-3 h-3 text-purple-400" />
                      </button>
                    )}
                  </h1>
                  <p className="text-sm text-yellow-400 font-semibold">นักพยากรณ์อันดับ #{rankPosition ?? "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-purple-300">{localTitle}</p>
                    <RankBadge tier={tier} size="sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg glass hover:bg-white/10 transition-colors">
                    <Bell className="w-4 h-4 text-purple-400" />
                  </button>
                  {isOwner && (
                    <button onClick={() => setEditOpen(true)} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all">
                      แก้ไขโปรไฟล์
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <XPBar current={xp} max={level * 208} level={level} />
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: "พาราฯ", value: coins.toLocaleString(), icon: null, color: "text-yellow-400" },
              { label: "ความแม่น", value: `${accuracy}%`, icon: "🎯", color: "text-green-400" },
              { label: "ทำนายแล้ว", value: totalPredictions.toLocaleString(), icon: "🔮", color: "text-purple-400" },
              { label: "อันดับโลก", value: rankPosition ? `#${rankPosition}` : "—", icon: "🏆", color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <div className="flex justify-center mb-0.5">
                  {s.icon === null
                    ? <Image src="/images/point2.png" alt="point" width={24} height={24} />
                    : <span className="text-lg">{s.icon}</span>}
                </div>
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="font-bold text-[var(--text-primary)]">ความสำเร็จ</h2>
            <span className="chip chip-gold ml-auto">{badges.filter(b => b.unlocked).length}/{badges.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((b) => (
              <div key={b.label} className={`glass rounded-xl p-3 flex items-center gap-3 transition-all
                ${b.unlocked ? "border border-yellow-400/20 card-hover" : "opacity-40"}`}>
                <span className="text-2xl flex-shrink-0">{b.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{b.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats donut */}
        <div className="glass rounded-xl p-4">
          <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> สถิติการทำนาย
          </h2>
          <div className="flex items-center gap-8">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="12"
                  strokeDasharray={`${accuracy * 2.51} ${100 * 2.51}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-[var(--text-primary)]">{totalPredictions.toLocaleString()}</span>
                <span className="text-[10px] text-[var(--text-muted)]">ทำนายทั้งหมด</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "ถูก",   count: correctPredictions, color: "#4ade80" },
                { label: "ผิด",   count: wrongCount,         color: "#f87171" },
                { label: "รอผล", count: pendingCount,        color: "#a855f7" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-sm text-[var(--text-muted)] w-10">{s.label}</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex border-b border-[rgba(124,58,237,0.2)]">
            {(["history", "badges", "stats"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? "text-purple-300 bg-purple-500/10 border-b-2 border-purple-500" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                {t === "history" ? "ประวัติทำนาย" : t === "badges" ? "เหรียญตรา" : "สถิติ"}
              </button>
            ))}
          </div>
          <div className="divide-y divide-[rgba(124,58,237,0.1)]">
            {voteHistory.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                ยังไม่มีประวัติการทำนาย
              </div>
            ) : voteHistory.map((h) => {
              const pred = h.predictions;
              const isExpired = pred ? new Date(pred.ends_at) < new Date() : false;
              const result = pred?.resolution == null
                ? (isExpired ? "expired" : "pending")
                : (pred.resolution === h.choice ? "win" : "lose");

              const total = (pred?.yes_pool ?? 0) + (pred?.no_pool ?? 0) || 1;
              const winPool = h.choice ? (pred?.no_pool ?? 0) : (pred?.yes_pool ?? 0);
              const myPool = h.choice ? (pred?.yes_pool ?? 1) : (pred?.no_pool ?? 1);
              const earn = result === "win"
                ? Math.floor(h.amount + (h.amount / myPool) * winPool * 0.95)
                : 0;

              return (
                <Link
                  key={h.id}
                  href={pred ? `/predict/${pred.id}` : "#"}
                  className="px-4 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0
                    ${result === "win" ? "bg-green-500/20 text-green-400"
                    : result === "lose" ? "bg-red-500/20 text-red-400"
                    : result === "expired" ? "bg-gray-500/20 text-gray-400"
                    : "bg-purple-500/20 text-purple-400"}`}>
                    {result === "win" ? "✓" : result === "lose" ? "✗" : result === "expired" ? "🔒" : "⌛"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{pred?.title ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      เลือก: <span className="text-purple-400">{h.choice ? "ใช่" : "ไม่ใช่"}</span>
                      {result === "pending" && <span className="ml-2 text-purple-400/60">· รอผล</span>}
                      {result === "expired" && <span className="ml-2 text-gray-400/60">· รอประกาศ</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">
                      {result === "win"
                        ? <span className="text-green-400">+{earn.toLocaleString()}</span>
                        : result === "lose"
                        ? <span className="text-red-400">-{h.amount.toLocaleString()}</span>
                        : <span className="text-[var(--text-muted)]">{h.amount.toLocaleString()}</span>}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">พาราฯ</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
