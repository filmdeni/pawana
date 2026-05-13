"use client";
import { useState } from "react";
import Image from "next/image";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import RankBadge from "@/components/RankBadge";

interface Leader {
  id: string;
  username: string;
  display_name: string | null;
  title: string | null;
  tier: "bronze" | "silver" | "gold" | "diamond" | "legend";
  coins: number;
  level: number;
  streak: number;
  rank_position: number | null;
  total_predictions: number;
  correct_predictions: number;
  accuracy_pct: number;
  avatar_url?: string | null;
}

const podiumConfig = [
  { idx: 1, h: "h-36", ringColor: "#b0b8c8", glowColor: "rgba(176,184,200,0.30)", order: "order-1" },
  { idx: 0, h: "h-44", ringColor: "#D7B56D", glowColor: "rgba(215,181,109,0.50)", order: "order-2" },
  { idx: 2, h: "h-28", ringColor: "#cd7f32", glowColor: "rgba(205,127,50,0.30)",  order: "order-3" },
];

const RANK_BADGE: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

function ChangeIcon({ change }: { change: string }) {
  if (change.startsWith("+")) return <TrendingUp className="w-3 h-3 text-[#5ED3A6]" />;
  if (change.startsWith("-")) return <TrendingDown className="w-3 h-3 text-[#D96B6B]" />;
  return <Minus className="w-3 h-3 text-[var(--text-muted)]" />;
}

function Avatar({ url, name, size }: { url?: string | null; name: string; size: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover w-full h-full"
      />
    );
  }
  return <>{name[0]?.toUpperCase()}</>;
}

interface Props {
  dbLeaders: Leader[];
  currentUserId: string | null;
}

export default function RankingClient({ dbLeaders, currentUserId }: Props) {
  const [tab, setTab] = useState("ตลอดกาล");

  const leaders = [...dbLeaders]
    .sort((a, b) => b.coins - a.coins)
    .map((u, i) => ({
      ...u,
      rank: i + 1,
      name: u.display_name ?? u.username,
      badge: RANK_BADGE[i + 1] ?? "",
      isMe: u.id === currentUserId,
    }));

  const top3 = leaders.slice(0, 3);
  const rest  = leaders.slice(3);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3"
          style={{ background: "rgba(215,181,109,0.10)", border: "1px solid rgba(215,181,109,0.25)", color: "#D7B56D" }}
        >
          <Trophy className="w-4 h-4" /> Hall of Legends
        </div>
        <h1 className="text-3xl font-black gradient-gold glow-text-gold mb-1">อันดับนักพยากรณ์</h1>
        <p className="text-sm text-[var(--text-muted)]">ผู้ที่แม่นที่สุดในจักรวาลภาวนา</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {["รายสัปดาห์", "รายเดือน", "ตลอดกาล"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === t ? {
              background: "linear-gradient(135deg, #4B3975, #6F4BFF)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(111,75,255,0.30)",
            } : {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #2A1F45",
              color: "var(--text-muted)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Podium — only if ≥ 3 real players */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-10 px-4">
          {podiumConfig.map(({ idx, h, ringColor, glowColor, order }) => {
            const u = top3[idx];
            if (!u) return null;
            const isFirst = idx === 0;
            return (
              <div key={u.rank} className={`flex flex-col items-center flex-1 max-w-44 ${order}`}>
                <div className="relative mb-3">
                  <div
                    className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} rounded-full flex items-center justify-center font-black text-white overflow-hidden`}
                    style={{
                      fontSize: isFirst ? "1.5rem" : "1.25rem",
                      border: `2px solid ${ringColor}60`,
                      boxShadow: `0 0 ${isFirst ? 36 : 20}px ${glowColor}`,
                      background: "linear-gradient(135deg, #6F4BFF, #A78BFA)",
                    }}
                  >
                    <Avatar url={u.avatar_url} name={u.name} size={isFirst ? 80 : 64} />
                  </div>
                  {isFirst && <div className="absolute -inset-2 rounded-full border aura-ring" style={{ borderColor: `${ringColor}40` }} />}
                  <span className="absolute -top-2 -right-1 text-xl">{u.badge}</span>
                </div>
                <div
                  className={`w-full ${h} rounded-t-2xl flex flex-col items-center justify-start pt-3 px-2 relative overflow-hidden`}
                  style={{
                    background: isFirst
                      ? `linear-gradient(180deg, rgba(215,181,109,0.18) 0%, rgba(14,11,29,0.95) 100%)`
                      : `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(14,11,29,0.95) 100%)`,
                    border: `1px solid ${ringColor}30`,
                    borderBottom: "none",
                  }}
                >
                  {isFirst && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ringColor}, transparent)` }} />
                  )}
                  <p className="text-xs font-black text-[var(--text-primary)] truncate w-full text-center">{u.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate w-full text-center mt-0.5">{u.title ?? "นักพยากรณ์"}</p>
                  <p className="font-black mt-1.5" style={{ color: ringColor, fontSize: isFirst ? "0.95rem" : "0.8rem" }}>
                    {(u.coins / 1_000_000).toFixed(2)}M
                  </p>
                  <div className="mt-1.5">
                    <RankBadge tier={u.tier} size="sm" />
                  </div>
                  {u.streak > 0 && (
                    <p className="text-[10px] text-[#FFB86B] mt-1 flex items-center gap-0.5">
                      <span className="fire-flicker">🔥</span> {u.streak} วัน
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {leaders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)]">ยังไม่มีผู้เล่นในระบบ</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Table header — hidden on mobile */}
          <div
            className="hidden sm:grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: "var(--text-muted)", borderBottom: "1px solid #1E1535" }}
          >
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-4">ผู้เล่น</span>
            <span className="col-span-2 text-right">ญาณฯ</span>
            <span className="col-span-2 text-right">ความแม่น</span>
            <span className="col-span-1 text-right">สตรีค</span>
            <span className="col-span-2 text-right">การทาย</span>
          </div>

          {leaders.map((u, i) => (
            <div
              key={u.id}
              className="px-3 sm:px-4 py-3 sm:py-3.5 items-center transition-colors hover:bg-white/[0.02]"
              style={{
                borderBottom: i < leaders.length - 1 ? "1px solid #1A1530" : "none",
                background: u.isMe ? "rgba(111,75,255,0.10)" : undefined,
                ...(u.isMe ? { borderLeft: "2px solid #6F4BFF" } : {}),
              }}
            >
              {/* Mobile layout */}
              <div className="flex sm:hidden items-center gap-3">
                <span className="w-6 text-center text-sm font-black text-[var(--text-muted)] flex-shrink-0">
                  {u.badge || `#${u.rank}`}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #6F4BFF, #A78BFA)" }}
                >
                  <Avatar url={u.avatar_url} name={u.name} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {u.name}
                    {u.isMe && <span className="text-[10px] text-[#6F4BFF] ml-1">(คุณ)</span>}
                  </p>
                  <RankBadge tier={u.tier} size="sm" />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black" style={{ color: "#D7B56D" }}>{u.coins.toLocaleString()}</p>
                  <p className="text-[11px]" style={{ color: "#5ED3A6" }}>{u.accuracy_pct}%</p>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-12 items-center">
                <span className="col-span-1 text-center text-sm font-black text-[var(--text-muted)]">
                  {u.badge || `#${u.rank}`}
                </span>
                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #6F4BFF, #A78BFA)" }}
                  >
                    <Avatar url={u.avatar_url} name={u.name} size={32} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {u.name}
                      {u.isMe && <span className="text-[10px] text-[#6F4BFF] ml-1">(คุณ)</span>}
                    </p>
                    <RankBadge tier={u.tier} size="sm" />
                  </div>
                </div>
                <span className="col-span-2 text-right text-sm font-black" style={{ color: "#D7B56D" }}>
                  {u.coins.toLocaleString()}
                </span>
                <span className="col-span-2 text-right text-sm font-semibold" style={{ color: "#5ED3A6" }}>
                  {u.accuracy_pct}%
                </span>
                <span className="col-span-1 text-right text-xs" style={{ color: "#FFB86B" }}>
                  {u.streak > 0 ? <span className="fire-flicker inline-block">🔥{u.streak}</span> : "—"}
                </span>
                <span className="col-span-2 text-right text-xs text-[var(--text-muted)]">
                  {u.total_predictions} / {u.correct_predictions}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[var(--text-muted)] mt-4 flex items-center justify-center gap-1.5">
        <span className="relative w-1.5 h-1.5 rounded-full bg-[#5ED3A6] live-dot inline-block" />
        ข้อมูลสด {leaders.length} ผู้เล่น จากฐานข้อมูล
      </p>
    </div>
  );
}
