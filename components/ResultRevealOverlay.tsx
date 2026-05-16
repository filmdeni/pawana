"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Skull, Scroll, CheckCircle2 } from "lucide-react";
import { claimPredictionReward } from "@/lib/actions/rewards";
import { useRealtimeResolution } from "@/lib/hooks/useRealtimeResolution";
import type { ResolutionState } from "@/lib/hooks/useRealtimeResolution";

interface RelatedPrediction {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  endsAt: string;
}

interface Props {
  predictionId: string;
  initialResolution: boolean | null;
  initialResolutionIndex?: number | null;
  userVote: { choice: boolean; choice_index?: number | null; amount: number } | null;
  rewardClaimed: boolean;
  rewardAmount: number;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  predictionTitle: string;
  related?: RelatedPrediction[];
}

type Phase = "waiting" | "reveal" | "win" | "lose" | "claimed" | "no_vote";

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "หมดเวลาแล้ว";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `อีก ${days} วัน`;
  if (hours > 0) return `อีก ${hours} ชม.`;
  return `อีก ${Math.floor((diff % 3600000) / 60000)} นาที`;
}

export default function ResultRevealOverlay({
  predictionId,
  initialResolution,
  initialResolutionIndex,
  userVote,
  rewardClaimed,
  rewardAmount,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
  options,
  predictionTitle,
  related = [],
}: Props) {
  const { resolution, resolutionIndex } = useRealtimeResolution(predictionId, initialResolution, initialResolutionIndex);

  const isMultiOption = resolutionIndex !== null && resolutionIndex !== undefined;
  const isResolved = isMultiOption ? true : resolution !== null;

  const initialPhase: Phase = isResolved ? "reveal" : "waiting";

  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [claiming, setClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(rewardAmount);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; size: number }[]>([]);
  const [justResolved, setJustResolved] = useState(false);

  // Determine winning label
  let winLabel = "";
  if (isMultiOption && resolutionIndex !== null && resolutionIndex !== undefined) {
    winLabel = options?.[resolutionIndex] ?? `ตัวเลือกที่ ${resolutionIndex + 1}`;
  } else if (resolution !== null) {
    winLabel = resolution ? yesLabel : noLabel;
  }

  // Determine if the current user won
  function userWon(): boolean {
    if (!userVote) return false;
    if (isMultiOption) return userVote.choice_index === resolutionIndex;
    return userVote.choice === resolution;
  }

  // Load just_voted data from sessionStorage
  // Transition from "waiting" → "reveal" when resolution arrives via realtime
  useEffect(() => {
    const resolved = isMultiOption || resolution !== null;
    if (!resolved) return;
    if (phase === "waiting") {
      setJustResolved(true);
      setPhase("reveal");
    }
  }, [resolution, resolutionIndex]);

  // After "reveal" cinematic pause, transition to final state + auto-claim if winner
  useEffect(() => {
    if (phase !== "reveal") return;
    const resolved = isMultiOption || resolution !== null;
    if (!resolved) return;

    const timer = setTimeout(async () => {
      if (!userVote) {
        setPhase("no_vote");
      } else if (rewardClaimed) {
        setPhase("claimed");
      } else if (userWon()) {
        const res = await claimPredictionReward(predictionId);
        if (res.ok) {
          setClaimedAmount(res.reward);
          setNewBalance(res.newBalance);
          setPhase("claimed");
        } else if (res.reason === "already_claimed") {
          // Admin already credited — just show claimed
          setPhase("claimed");
        } else {
          setPhase("win"); // fallback manual claim
        }
        spawnParticles();
      } else {
        setPhase("lose");
      }
    }, justResolved ? 2200 : 600);
    return () => clearTimeout(timer);
  }, [phase, resolution, resolutionIndex]);

  function spawnParticles() {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        delay: Math.random() * 1.0,
        size: 8 + Math.random() * 14,
      }))
    );
  }

  async function handleClaim() {
    setClaiming(true);
    const res = await claimPredictionReward(predictionId);
    if (res.ok) {
      setClaimedAmount(res.reward);
      setNewBalance(res.newBalance);
      setPhase("claimed");
      spawnParticles();
    }
    setClaiming(false);
  }

  if (!visible) return null;
  if (phase === "waiting" && isResolved) return null;
  if (phase === "waiting" && !userVote) return null;

  // WaitingState แสดงเป็น popup เล็กๆ ไม่ต้องคลุมเต็มจอ
  if (phase === "waiting") {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-4 px-4">
        <WaitingState predictionTitle={predictionTitle} onClose={() => setVisible(false)} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)" }}
    >
      {/* Coin particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute animate-float-up"
          style={{ left: `${p.x}%`, bottom: 0, animationDelay: `${p.delay}s` }}
        >
          <img
            src="/images/point2.png"
            alt=""
            style={{ width: p.size, height: p.size, opacity: 0.85 }}
            className="object-contain"
          />
        </div>
      ))}

      <div className="relative w-full max-w-sm mx-4">
        {phase === "reveal" && <RevealState winLabel={winLabel} justResolved={justResolved} />}
        {phase === "win" && (
          <WinState
            winLabel={winLabel}
            staked={userVote?.amount ?? 0}
            predictionTitle={predictionTitle}
            claiming={claiming}
            onClaim={handleClaim}
            related={related}
          />
        )}
        {phase === "lose" && (
          <LoseState
            staked={userVote?.amount ?? 0}
            winLabel={winLabel}
            related={related}
            onClose={() => setVisible(false)}
          />
        )}
        {phase === "claimed" && (
          <ClaimedState
            amount={claimedAmount}
            newBalance={newBalance}
            related={related}
            onClose={() => setVisible(false)}
          />
        )}
        {phase === "no_vote" && (
          <NoVoteState winLabel={winLabel} related={related} onClose={() => setVisible(false)} />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function WaitingState({ predictionTitle, onClose }: { predictionTitle: string; onClose: () => void }) {
  return (
    <div
      className="rounded-2xl px-5 py-5 flex items-center gap-4 shadow-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(18,10,40,0.97) 0%, rgba(12,6,28,0.97) 100%)",
        border: "1px solid rgba(111,75,255,0.3)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(111,75,255,0.1)",
      }}
    >
      <div className="text-3xl flex-shrink-0 animate-pulse">⏳</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-base leading-tight">รอประกาศผล</p>
        <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{predictionTitle}</p>
        <p className="text-white/25 text-[11px] mt-1">ระบบจะแจ้งผลอัตโนมัติเมื่อผู้ดูแลเฉลย</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
      >
        ✕
      </button>
    </div>
  );
}

function RevealState({ winLabel, justResolved }: { winLabel: string; justResolved: boolean }) {
  return (
    <div className="text-center space-y-5">
      {justResolved ? (
        <>
          <div className="text-6xl" style={{ animation: "bounce 0.6s ease-out 3" }}>🔮</div>
          <p className="text-purple-300 font-black text-2xl tracking-widest animate-pulse">กำลังเปิดเผยชะตา...</p>
          <p className="text-white/50 text-base font-bold mt-2">{winLabel} ชนะ!</p>
        </>
      ) : (
        <>
          <div className="text-5xl animate-spin-slow">⌛</div>
          <p className="text-white/50 text-sm">กำลังโหลดผล...</p>
        </>
      )}
    </div>
  );
}

function WinState({
  winLabel, staked, predictionTitle, claiming, onClaim, related,
}: {
  winLabel: string; staked: number; predictionTitle: string;
  claiming: boolean; onClaim: () => void; related: RelatedPrediction[];
}) {
  return (
    <div
      className="rounded-3xl p-6 space-y-4 border border-yellow-500/30"
      style={{ background: "linear-gradient(135deg, rgba(20,10,40,0.97) 0%, rgba(40,20,5,0.97) 100%)" }}
    >
      {/* Trophy glow */}
      <div className="text-center">
        <div className="text-6xl mb-1" style={{ filter: "drop-shadow(0 0 24px rgba(245,158,11,0.7))" }}>🏆</div>
        <p className="text-yellow-400 font-black text-2xl tracking-wide">คุณทายถูก!</p>
        <p className="text-white/40 text-xs mt-1 line-clamp-2">{predictionTitle}</p>
      </div>

      {/* Result + stake */}
      <div className="rounded-2xl px-4 py-3 space-y-2" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/40">ฝั่งที่ชนะ</span>
          <span className="text-green-400 font-black">{winLabel}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/40">เดิมพันไว้</span>
          <div className="flex items-center gap-1">
            <span className="text-white font-bold">{staked.toLocaleString()}</span>
            <img src="/images/point2.png" alt="ญาณ" className="w-4 h-4 object-contain" />
          </div>
        </div>
      </div>

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={claiming}
        className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: claiming ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: claiming ? "rgba(255,255,255,0.5)" : "#1a0a00",
          boxShadow: claiming ? "none" : "0 0 32px rgba(245,158,11,0.45)",
        }}
      >
        {claiming ? "กำลังรับรางวัล..." : "✦ รับรางวัล"}
      </button>

      <RelatedSection related={related} />
    </div>
  );
}

function LoseState({
  staked, winLabel, related, onClose,
}: {
  staked: number; winLabel: string; related: RelatedPrediction[]; onClose: () => void;
}) {
  return (
    <div
      className="rounded-3xl p-6 space-y-4 border border-red-900/30"
      style={{ background: "linear-gradient(135deg, rgba(20,5,5,0.97) 0%, rgba(15,10,30,0.97) 100%)" }}
    >
      <div className="text-center">
        <div className="text-6xl mb-1">💀</div>
        <p className="text-red-400 font-black text-2xl">ครั้งนี้ผิดพลาด...</p>
        <p className="text-white/30 text-xs mt-1">ชะตาลิขิตไม่ได้อยู่ข้างคุณคราวนี้</p>
      </div>

      <div className="rounded-2xl px-4 py-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/40">ฝั่งที่ชนะ</span>
          <span className="text-white/70 font-bold">{winLabel}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/40">ญาณที่เสียไป</span>
          <div className="flex items-center gap-1">
            <span className="text-red-400 font-bold">-{staked.toLocaleString()}</span>
            <img src="/images/point2.png" alt="ญาณ" className="w-4 h-4 object-contain opacity-50" />
          </div>
        </div>
      </div>

      <RelatedSection related={related} />

      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl font-bold text-sm text-white/50 border border-white/10 hover:border-white/20 transition-colors"
      >
        ดูรายละเอียดพยากรณ์
      </button>
    </div>
  );
}

function ClaimedState({
  amount, newBalance, related, onClose,
}: {
  amount: number; newBalance: number | null; related: RelatedPrediction[]; onClose: () => void;
}) {
  return (
    <div
      className="rounded-3xl p-6 space-y-4 border border-green-500/20"
      style={{ background: "linear-gradient(135deg, rgba(5,20,10,0.97) 0%, rgba(15,10,30,0.97) 100%)" }}
    >
      <div className="text-center">
        <div className="text-6xl mb-1" style={{ filter: "drop-shadow(0 0 20px rgba(34,197,94,0.6))" }}>✅</div>
        <p className="text-green-400 font-black text-2xl">รับรางวัลแล้ว!</p>
        <p className="text-white/40 text-xs mt-1">ญาณถูกโอนเข้ากระเป๋าแล้ว</p>
      </div>

      <div className="rounded-2xl px-4 py-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="text-center">
          <p className="text-white/40 text-xs mb-1">ได้รับ</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400 font-black text-3xl">{amount.toLocaleString()}</span>
            <img src="/images/point2.png" alt="ญาณ" className="w-7 h-7 object-contain" />
          </div>
        </div>
        {newBalance !== null && (
          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm">
            <span className="text-white/40">ยอดคงเหลือ</span>
            <div className="flex items-center gap-1">
              <span className="text-white font-bold">{newBalance.toLocaleString()}</span>
              <img src="/images/point2.png" alt="ญาณ" className="w-4 h-4 object-contain" />
            </div>
          </div>
        )}
      </div>

      <RelatedSection related={related} label="ลองทายอีกครั้งกับพยากรณ์เหล่านี้" />

      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
      >
        ปิด
      </button>
    </div>
  );
}

function NoVoteState({ winLabel, related, onClose }: { winLabel: string; related: RelatedPrediction[]; onClose: () => void }) {
  return (
    <div
      className="rounded-3xl p-6 space-y-4 border border-white/10"
      style={{ background: "rgba(15,10,30,0.97)" }}
    >
      <div className="text-center">
        <div className="text-6xl mb-1">📜</div>
        <p className="text-white font-black text-xl">ผลออกแล้ว!</p>
        <p className="text-white/40 text-xs mt-1">คุณไม่ได้เข้าร่วมพยากรณ์นี้</p>
      </div>

      <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <p className="text-white/40 text-xs text-center mb-1">ฝั่งที่ชนะ</p>
        <p className="text-yellow-300 font-black text-2xl text-center">{winLabel}</p>
      </div>

      <RelatedSection related={related} label="ร่วมทายพยากรณ์ที่เปิดอยู่" />

      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl font-bold text-sm text-white/50 border border-white/10 hover:border-white/20 transition-colors"
      >
        ดูรายละเอียด
      </button>
    </div>
  );
}

function RelatedSection({
  related,
  label = "พยากรณ์อื่นที่น่าสนใจ",
}: {
  related: RelatedPrediction[];
  label?: string;
}) {
  if (!related.length) {
    return (
      <Link
        href="/predict"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
      >
        ดูพยากรณ์ทั้งหมด <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-white/40 text-xs font-semibold px-0.5">{label}</p>
      {related.slice(0, 2).map((r) => (
        <Link
          key={r.id}
          href={`/predict/${r.id}`}
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border border-white/8 hover:border-purple-500/30 hover:bg-purple-500/5 transition-colors group"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-semibold line-clamp-1 group-hover:text-white transition-colors">
              {r.categoryEmoji && <span className="mr-1">{r.categoryEmoji}</span>}{r.title}
            </p>
            <p className="text-white/30 text-[10px] mt-0.5">{timeLeft(r.endsAt)}</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400/50 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
        </Link>
      ))}
      <Link
        href="/predict"
        className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-white/30 hover:text-purple-300 transition-colors"
      >
        ดูทั้งหมด <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
