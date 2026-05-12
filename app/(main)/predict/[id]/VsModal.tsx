"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import VotePanel from "@/components/VotePanel";
import { clampPct } from "@/lib/poolDisplay";

interface VsModalProps {
  predictionId: string;
  yesPct: number;
  noPct: number;
  yesPool: number;
  noPool: number;
  initialYesPool: number;
  initialNoPool: number;
  endsAt: string;
  userVote?: { choice: boolean; amount: number } | null;
  isLoggedIn: boolean;
  yesLabel?: string;
  noLabel?: string;
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
}: VsModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);
  const { yes: yesDisplay, no: noDisplay } = clampPct(yesPct);
  const router = useRouter();

  function openWith(choice: boolean) {
    if (!isLoggedIn) {
      router.push(`/login?next=/predict/${predictionId}`);
      return;
    }
    setSelectedChoice(choice);
    setOpen(true);
  }

  return (
    <>
      {/* VS split — clickable */}
      <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-white/10">
        <div className="flex">
          {/* Yes */}
          <button
            onClick={() => openWith(true)}
            className="flex-1 py-5 text-center transition-all hover:brightness-125"
            style={{ background: "rgba(34,197,94,0.15)" }}
          >
            <p className="text-xs font-semibold text-green-400 mb-1">{yesLabel}</p>
            <p className="text-4xl font-black text-green-400 leading-none">{yesDisplay}%</p>
            <p className="text-xs text-green-600 mt-2">{yesPool.toLocaleString()} พารา</p>
          </button>

          {/* VS badge */}
          <div className="relative flex items-center justify-center w-14 z-10 bg-[rgba(10,5,20,0.6)] border-x border-white/10">
            {/* glow layers */}
            <div className="absolute w-10 h-10 rounded-full bg-green-500/20 blur-md -left-2" />
            <div className="absolute w-10 h-10 rounded-full bg-red-500/20 blur-md -right-2" />
            {/* hexagon ring */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#1a0a2e] to-[#0d0515] border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.5),inset_0_0_8px_rgba(168,85,247,0.1)]">
              <span className="text-[11px] font-black tracking-[0.15em] bg-gradient-to-b from-white to-purple-300 bg-clip-text text-transparent select-none">
                VS
              </span>
            </div>
          </div>

          {/* No */}
          <button
            onClick={() => openWith(false)}
            className="flex-1 py-5 text-center transition-all hover:brightness-125"
            style={{ background: "rgba(239,68,68,0.15)" }}
          >
            <p className="text-xs font-semibold text-red-400 mb-1">{noLabel}</p>
            <p className="text-4xl font-black text-red-400 leading-none">{noDisplay}%</p>
            <p className="text-xs text-red-600 mt-2">{noPool.toLocaleString()} พารา</p>
          </button>
        </div>

        {/* pool bar */}
        <div className="flex h-1.5">
          <div className="bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700 shadow-[0_0_6px_rgba(34,197,94,0.6)]" style={{ width: `${yesDisplay}%` }} />
          <div className="bg-gradient-to-l from-red-600 to-red-400 transition-all duration-700 shadow-[0_0_6px_rgba(239,68,68,0.6)]" style={{ width: `${noDisplay}%` }} />
        </div>
      </div>

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
              initialChoice={selectedChoice}
              onVoteSuccess={() => setOpen(false)}
              yesLabel={yesLabel}
              noLabel={noLabel}
            />
          </div>
        </div>
      )}
    </>
  );
}
