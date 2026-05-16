"use client";
import { useEffect, useState } from "react";

interface TickerComment {
  id: string;
  username: string;
  color: string;
  text: string;
}

const COMMENTS: TickerComment[] = [
  { id: "1",  username: "oracle_9x",   color: "#7C3AED", text: "ลิเวอร์พูลชนะแน่ ฟอร์มดีมาก 3 เกมล่าสุด" },
  { id: "2",  username: "NightSage",   color: "#0891B2", text: "GTA 6 เลื่อนออกไปอีกแน่นอน Rockstar เนิบเลย" },
  { id: "3",  username: "DataMind_",   color: "#059669", text: "สถิติบอกว่า YES 78% ใน 5 ปีที่ผ่านมา" },
  { id: "4",  username: "visionaryX",  color: "#B45309", text: "ดราม่าคู่นี้ยืดไปสิ้นปีแน่ ๆ" },
  { id: "5",  username: "ThirdEye77",  color: "#9333EA", text: "Elon ทวีตอะไรก็ขึ้นหมด ลุ้น YES เลย" },
  { id: "6",  username: "quantumbet",  color: "#DC2626", text: "NO pool พุ่งผิดปกติ อาจมี insider" },
  { id: "7",  username: "LunarMind",   color: "#0284C7", text: "BTC ยืนเหนือ 70k ตอบ YES ได้เลย" },
  { id: "8",  username: "SentinelAI",  color: "#16A34A", text: "โมเดล ML ล่าสุดให้ 63% โอกาส NO" },
  { id: "9",  username: "cryptoseer",  color: "#7C3AED", text: "ชุมชนเริ่มแกว่งมา YES sentiment เปลี่ยน" },
  { id: "10", username: "GalaxySeer",  color: "#EA580C", text: "กระแส Twitter พุ่ง มีคนพูดถึงเยอะมาก" },
  { id: "11", username: "FutureProbe", color: "#6D28D9", text: "ข้อมูลตลาดชี้ไปทาง NO ชัดเจน" },
  { id: "12", username: "PulseTrack",  color: "#0F766E", text: "ทั้ง 2 ฝั่งสูสีมาก แต่ผมเลือก YES" },
];

function Avatar({ username, color }: { username: string; color: string }) {
  return (
    <div
      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
      style={{
        background: color,
        border: `1.5px solid ${color}`,
        color: "#fff",
        boxShadow: `0 0 10px ${color}66`,
      }}
    >
      {username[0].toUpperCase()}
    </div>
  );
}

function CommentCard({ c }: { c: TickerComment }) {
  return (
    <div
      className="flex items-start gap-2.5 px-1 py-2 flex-shrink-0"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 2,
      }}
    >
      <Avatar username={c.username} color={c.color} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-none mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
          {c.username}
        </p>
        <p className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "break-word" }}>
          {c.text}
        </p>
      </div>
    </div>
  );
}

export default function PredictionTicker({ height = 220, className }: { height?: number; className?: string }) {
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setLive(true);
      setTimeout(() => setLive(false), 2000);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const doubled = [...COMMENTS, ...COMMENTS];

  return (
    <div className={`flex flex-col w-full ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "#5ED3A6", boxShadow: "0 0 5px rgba(94,211,166,0.9)", animation: "live-pulse 1.4s ease-in-out infinite" }}
        />
        <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
          community
        </span>
        <span
          className="text-[8px] font-bold px-1 py-0.5 rounded-full"
          style={{
            background: "rgba(94,211,166,0.1)",
            color: "#5ED3A6",
            border: "1px solid rgba(94,211,166,0.2)",
            visibility: live ? "visible" : "hidden",
          }}
        >
          new
        </span>
      </div>

      {/* Vertical scroll area */}
      <div
        className="overflow-hidden relative"
        style={{
          height,
          maskImage: "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="ticker-track-y"
          style={{ animationDuration: "45s", animationPlayState: paused ? "paused" : "running" }}
        >
          {doubled.map((c, i) => (
            <CommentCard key={`${c.id}-${i}`} c={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
