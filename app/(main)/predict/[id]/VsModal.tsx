"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import VotePanel from "@/components/VotePanel";
import ProbabilityChart from "@/components/ProbabilityChart";
import { clampPct } from "@/lib/poolDisplay";

const OPTION_BG_COLORS = [
  "rgba(34,197,94,0.15)",
  "rgba(239,68,68,0.15)",
  "rgba(251,191,36,0.15)",
  "rgba(139,92,246,0.15)",
  "rgba(59,130,246,0.15)",
];
const OPTION_TEXT_COLORS = ["text-green-400", "text-red-400", "text-yellow-400", "text-purple-400", "text-blue-400"];
const OPTION_POOL_COLORS = ["text-green-600", "text-red-600", "text-yellow-600", "text-purple-600", "text-blue-600"];
const OPTION_BTN_YES = [
  "bg-green-500/20 hover:bg-green-500/35 text-green-300 border-green-500/30",
  "bg-red-500/20 hover:bg-red-500/35 text-red-300 border-red-500/30",
  "bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-300 border-yellow-500/30",
  "bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border-purple-500/30",
  "bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 border-blue-500/30",
];
const OPTION_BTN_NO = [
  "bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border-rose-700/30",
  "bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 border-orange-700/30",
  "bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border-amber-700/30",
  "bg-violet-900/30 hover:bg-violet-900/50 text-violet-300 border-violet-700/30",
  "bg-sky-900/30 hover:bg-sky-900/50 text-sky-300 border-sky-700/30",
];

interface VsModalProps {
  predictionId: string;
  yesPct: number;
  noPct: number;
  yesPool: number;
  noPool: number;
  initialYesPool: number;
  initialNoPool: number;
  endsAt: string;
  userVote?: { choice: boolean; choice_index?: number | null; amount: number } | null;
  isLoggedIn: boolean;
  yesLabel?: string;
  noLabel?: string;
  options?: string[] | null;
  optionPools?: number[] | null;
  userXp?: number;
  userLevel?: number;
  initialChoice?: boolean | null;
  isSports?: boolean;
  chartData?: Record<string, number | string>[];
  chartOptions?: string[];
}

export default function VsModal({
  predictionId,
  yesPct,
  noPct,
  yesPool,
  noPool,
  initialYesPool,
  initialNoPool,
  endsAt,
  userVote,
  isLoggedIn,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
  options,
  optionPools,
  userXp = 0,
  userLevel = 1,
  initialChoice = null,
  isSports = false,
  chartData,
  chartOptions,
}: VsModalProps) {
  const [open, setOpen] = useState(initialChoice !== null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(
    initialChoice === true ? 0 : initialChoice === false ? 1 : null
  );
  const { yes: yesDisplay, no: noDisplay } = clampPct(yesPct);
  const router = useRouter();

  const isMulti = options && options.length > 2;
  const resolvedOptions = isMulti ? options : [yesLabel, noLabel];
  const resolvedPools = isMulti ? (optionPools ?? options!.map(() => 0)) : [yesPool, noPool];
  const totalPool = resolvedPools.reduce((s, v) => s + v, 0) || 1;

  function openWithIndex(idx: number) {
    if (!isLoggedIn) {
      router.push(`/login?next=/predict/${predictionId}`);
      return;
    }
    setSelectedChoiceIndex(idx);
    setOpen(true);
  }

  const initialVotePanelChoice = selectedChoiceIndex === null ? null : selectedChoiceIndex === 0;

  // ── Sports layout ─────────────────────────────────────────────
  if (isSports && chartData && chartOptions) {
    const mockPrevPools = resolvedPools.map((p) => Math.max(0, p - Math.floor(p * 0.15 + Math.random() * p * 0.2)));
    const prevTotal = mockPrevPools.reduce((s, v) => s + v, 0) || 1;

    return (
      <>
        {/* Chart */}
        <div className="px-4 pb-2">
          <ProbabilityChart options={chartOptions} data={chartData} />
        </div>

        {/* CTA หรือ voted summary */}
        <div className="px-4 pb-5 flex flex-col items-center gap-3">
          {userVote ? (
            <div className="w-full px-4 py-4 rounded-xl border border-purple-500/25 bg-purple-500/8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-300 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-muted)]">การทายของคุณ</p>
                  <p className="text-base font-bold text-white">
                    {userVote.choice ? (resolvedOptions?.[0] ?? yesLabel) : (resolvedOptions?.[1] ?? noLabel)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-purple-300">
                {userVote.amount.toLocaleString()}
                <img src="/images/point2.png" alt="ญาณ" className="w-4 h-4 object-contain" />
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => openWithIndex(0)}
                className="transition-all duration-200 active:scale-[0.96] hover:brightness-110"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/กดทาย.png" alt="กดทาย" className="h-24 w-auto object-contain" />
              </button>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                กดปุ่มเดียว → เลือกฝั่ง → ใส่จำนวน → ยืนยัน
              </p>
            </>
          )}
        </div>

        {/* Modal */}
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <div
              className="w-full max-w-md relative overflow-hidden sm:rounded-3xl"
              style={{
                background: "linear-gradient(160deg, rgba(12,5,28,0.98) 0%, rgba(18,8,40,0.98) 50%, rgba(8,4,20,0.98) 100%)",
                border: "1px solid rgba(111,75,255,0.35)",
                boxShadow: "0 0 80px rgba(111,75,255,0.2), 0 0 0 1px rgba(111,75,255,0.1), 0 32px 64px rgba(0,0,0,0.8)",
                maxHeight: "92vh",
                borderRadius: "24px 24px 0 0",
              }}
            >
              {/* Ambient top glow */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)" }} />
              <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(111,75,255,0.15) 0%, transparent 70%)" }} />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(111,75,255,0.2)", border: "1px solid rgba(111,75,255,0.35)" }}>
                    <span className="text-base">⚡</span>
                  </div>
                  <div>
                    <h2 className="font-black text-white text-base leading-none">วางเดิมพัน</h2>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>เข้าสู่ตลาดทำนาย</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="relative overflow-y-auto px-5 pb-6 pt-4" style={{ maxHeight: "calc(92vh - 70px)" }}>
                <VotePanel
                  predictionId={predictionId}
                  initialYesPool={initialYesPool}
                  initialNoPool={initialNoPool}
                  endsAt={endsAt}
                  userVote={userVote}
                  initialChoice={initialVotePanelChoice}
                  onVoteSuccess={() => {}}
                  yesLabel={yesLabel}
                  noLabel={noLabel}
                  options={isMulti ? options : null}
                  optionPools={isMulti ? optionPools : null}
                  userXp={userXp}
                  userLevel={userLevel}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Default layout ────────────────────────────────────────────
  return (
    <>
      {isMulti ? (
        /* Multi-option grid */
        <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-white/10">
          <div className={`grid gap-px bg-white/10`} style={{ gridTemplateColumns: `repeat(${Math.min(resolvedOptions!.length, 3)}, 1fr)` }}>
            {resolvedOptions!.map((label, i) => {
              const pool = resolvedPools[i] ?? 0;
              const pct = Math.round((pool / totalPool) * 100);
              return (
                <button
                  key={i}
                  onClick={() => openWithIndex(i)}
                  className={`py-4 text-center transition-all hover:brightness-125 ${OPTION_TEXT_COLORS[i % OPTION_TEXT_COLORS.length]}`}
                  style={{ background: OPTION_BG_COLORS[i % OPTION_BG_COLORS.length] }}
                >
                  <p className="text-xs font-semibold mb-1 truncate px-2">{label}</p>
                  <p className="text-2xl font-black leading-none">{pct}%</p>
                  <p className={`text-xs mt-1 ${OPTION_POOL_COLORS[i % OPTION_POOL_COLORS.length]}`}>{pool.toLocaleString()} ญาณ</p>
                </button>
              );
            })}
          </div>
          {/* pool bar */}
          <div className="flex h-1.5">
            {resolvedOptions!.map((_, i) => {
              const pool = resolvedPools[i] ?? 0;
              const pct = Math.round((pool / totalPool) * 100);
              const gradients = [
                "linear-gradient(90deg,#16a34a,#22c55e)",
                "linear-gradient(270deg,#b91c1c,#ef4444)",
                "linear-gradient(90deg,#b45309,#f59e0b)",
                "linear-gradient(90deg,#6d28d9,#8b5cf6)",
                "linear-gradient(90deg,#1d4ed8,#3b82f6)",
              ];
              return <div key={i} style={{ width: `${pct}%`, background: gradients[i % gradients.length], transition: "width 0.7s" }} />;
            })}
          </div>
        </div>
      ) : (
        /* Binary list style */
        <>
        {/* ถ้าทายแล้ว แสดงแค่ summary card ไม่มีปุ่มให้เลือก */}
        {userVote ? (
          <div className="mx-4 mt-4 mb-4 px-4 py-4 rounded-xl border border-purple-500/25 bg-purple-500/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-300 text-sm">✓</span>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">การทายของคุณ</p>
                <p className="text-base font-bold text-white">
                  {userVote.choice ? yesLabel : noLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-purple-300">
              {userVote.amount.toLocaleString()}
              <img src="/images/point2.png" alt="ญาณ" className="w-4 h-4 object-contain" />
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-4 mb-4 space-y-2">
            {[
              { label: yesLabel, pool: yesPool, idx: 0 },
              { label: noLabel, pool: noPool, idx: 1 },
            ].map(({ label, pool, idx }) => {
              const total = yesPool + noPool || 1;
              const multiplier = pool > 0 ? (total / pool).toFixed(2) : "—";
              return (
                <button
                  key={idx}
                  onClick={() => openWithIndex(idx)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 bg-transparent text-[var(--text-primary)] hover:bg-white/5 transition-all text-left"
                >
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{multiplier}x</span>
                </button>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-4 relative"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--text-primary)]">วางเดิมพัน</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-[var(--text-muted)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <VotePanel
              predictionId={predictionId}
              initialYesPool={initialYesPool}
              initialNoPool={initialNoPool}
              endsAt={endsAt}
              userVote={userVote}
              initialChoice={initialVotePanelChoice}
              onVoteSuccess={() => {}}
              yesLabel={yesLabel}
              noLabel={noLabel}
              options={isMulti ? options : null}
              optionPools={isMulti ? optionPools : null}
              userXp={userXp}
              userLevel={userLevel}
            />
          </div>
        </div>
      )}
    </>
  );
}
