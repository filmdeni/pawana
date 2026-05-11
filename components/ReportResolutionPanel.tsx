"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";

interface ReportStatus {
  total: number;
  yes_count: number;
  no_count: number;
  yes_pct: number | null;
  user_report: boolean | null;
}

interface Props {
  predictionId: string;
  endsAt: string;
}

export default function ReportResolutionPanel({ predictionId, endsAt }: Props) {
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEnded = new Date(endsAt) <= new Date();

  const fetchStatus = useCallback(async () => {
    const res = await fetch(`/api/resolutions/${predictionId}`);
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }, [predictionId]);

  useEffect(() => {
    if (hasEnded) fetchStatus();
    else setLoading(false);
  }, [hasEnded, fetchStatus]);

  const report = async (outcome: boolean) => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/resolutions/${predictionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "เกิดข้อผิดพลาด");
    } else {
      setStatus({ ...data, user_report: outcome });
    }
    setSubmitting(false);
  };

  if (!hasEnded || loading) return null;

  const yesPct = status?.yes_pct ?? 0;
  const noPct = 100 - yesPct;
  const hasConsensus = status && status.total >= 3 && (yesPct >= 70 || yesPct <= 30);
  const userAlreadyReported = status?.user_report !== null && status?.user_report !== undefined;

  return (
    <div className="glass rounded-2xl p-5 border border-[var(--gold-dim)]/30">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-[var(--gold)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          รายงานผลพยากรณ์
        </h2>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {status?.total ?? 0} เสียง
        </span>
      </div>

      {/* Consensus bar */}
      {status && status.total > 0 && (
        <div className="mb-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-panel)]">
            <div
              className="bg-[var(--success)] transition-all duration-500"
              style={{ width: `${yesPct}%` }}
            />
            <div
              className="bg-[var(--negative)] transition-all duration-500"
              style={{ width: `${noPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5 text-[var(--text-muted)]">
            <span className="text-[var(--success)]">ใช่ {yesPct}%</span>
            <span className="text-[var(--negative)]">ไม่ใช่ {noPct}%</span>
          </div>
        </div>
      )}

      {/* Consensus reached */}
      {hasConsensus && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-[var(--purple-glow)] border border-[var(--purple-dim)] text-xs text-[var(--gold)] text-center">
          ✦ ไพ่ชี้ทางแล้ว — เสียงชุมชนเป็นหนึ่งเดียว ✦
        </div>
      )}

      {/* Buttons */}
      {!userAlreadyReported ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)] text-center mb-3">
            ท่านเห็นว่าผลพยากรณ์นี้เป็นอย่างไร?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => report(true)}
              disabled={submitting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
                bg-[var(--success)]/10 border border-[var(--success)]/30
                hover:bg-[var(--success)]/20 hover:border-[var(--success)]/60
                text-[var(--success)] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              ใช่ ชนะ
            </button>
            <button
              onClick={() => report(false)}
              disabled={submitting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
                bg-[var(--negative)]/10 border border-[var(--negative)]/30
                hover:bg-[var(--negative)]/20 hover:border-[var(--negative)]/60
                text-[var(--negative)] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              ไม่ใช่ ชนะ
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-[var(--text-muted)]">
            ท่านรายงานว่า{" "}
            <span className={status?.user_report ? "text-[var(--success)] font-bold" : "text-[var(--negative)] font-bold"}>
              {status?.user_report ? "ใช่ ชนะ" : "ไม่ใช่ ชนะ"}
            </span>
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            เสียงแห่งท่านก้องในจักรวาลแล้ว ✦
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-[var(--negative)] text-center">{error}</p>
      )}

      {!status || status.total < 3 ? (
        <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
          ต้องการอย่างน้อย 3 เสียงเพื่อปิดผล
        </p>
      ) : null}
    </div>
  );
}
