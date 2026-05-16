import { Trophy } from "lucide-react";

interface Props {
  predictionId: string;
  endsAt: string;
  resolution: boolean | null;
  yesLabel?: string;
  noLabel?: string;
}

export default function ReportResolutionPanel({
  predictionId: _predictionId,
  endsAt: _endsAt,
  resolution,
  yesLabel = "ใช่",
  noLabel = "ไม่ใช่",
}: Props) {
  if (resolution === null) return null;

  const winLabel = resolution ? yesLabel : noLabel;
  return (
    <div className="glass rounded-2xl p-5 border border-[var(--gold-dim)]/40">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-[var(--gold)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">ผลพยากรณ์</h2>
      </div>
      <div className="flex flex-col items-center gap-2 py-3">
        <div
          className={`text-xl font-black ${resolution ? "text-[var(--success)]" : "text-[var(--negative)]"}`}
        >
          {winLabel} ชนะ
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center">
          ✦ ชะตาลิขิตแล้ว — ผู้ดูแลระบบเฉลยพยากรณ์นี้แล้ว ✦
        </p>
      </div>
    </div>
  );
}
