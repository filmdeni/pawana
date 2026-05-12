import Link from "next/link";
import { ArrowLeft, Clock, Users, TrendingUp } from "lucide-react";
import ReportResolutionPanel from "@/components/ReportResolutionPanel";
import ParallaxBg from "@/components/ParallaxBg";
import { getPredictionById, getUserVote } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import TabsSection from "./TabsSection";
import VsModal from "./VsModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MOCK_FALLBACK: Record<string, {
  title: string; category: string; description: string;
  yesPool: number; noPool: number; participants: number;
  endsAt: string; creator: string; hot: boolean; image_url: string | null;
}> = {
  "1": {
    title: "ดราม่าคู่รักดังคู่นี้จะเลิกกันภายในปี 2024 ไหม?",
    category: "ดราม่า",
    description: "จากกระแสที่แฟนคลับสังเกตว่าทั้งคู่ไม่ได้โพสต์รูปด้วยกันมากกว่า 3 เดือน และมีข่าวจากแหล่งข่าวใกล้ชิดว่าความสัมพันธ์อาจมีปัญหา ความเห็นคุณคืออะไร?",
    yesPool: 1729450, noPool: 671550, participants: 2400,
    endsAt: "2025-12-31T23:59:59Z", creator: "DramaQueen", hot: true, image_url: null,
  },
};

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "หมดเวลาแล้ว";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `อีก ${days} วัน`;
  if (hours > 0) return `อีก ${hours} ชม.`;
  return `อีก ${Math.floor((diff % 3600000) / 60000)} นาที`;
}

function closingLabel(endsAt: string): string {
  return new Date(endsAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgoStr(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

export default async function PredictDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [dbPred, user] = await Promise.all([
    getPredictionById(id).catch(() => null),
    getSessionUser().catch(() => null),
  ]);

  const pred = dbPred
    ? {
        title: dbPred.title,
        category: dbPred.categories?.label ?? "อื่นๆ",
        categoryEmoji: dbPred.categories?.emoji ?? "",
        description: dbPred.description ?? "",
        yesPool: dbPred.yes_pool,
        noPool: dbPred.no_pool,
        participants: dbPred.participant_count,
        endsAt: dbPred.ends_at,
        creator: dbPred.profiles?.display_name ?? dbPred.profiles?.username ?? "unknown",
        hot: dbPred.is_featured,
        image_url: dbPred.image_url,
        createdAt: null as string | null,
      }
    : { ...(MOCK_FALLBACK[id] ?? MOCK_FALLBACK["1"]), categoryEmoji: "", createdAt: null as string | null };

  const userVote = user && dbPred ? await getUserVote(dbPred.id, user.id).catch(() => null) : null;

  const total = pred.yesPool + pred.noPool || 1;
  const yesPct = Math.round((pred.yesPool / total) * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <ParallaxBg variant="purple" />
      <div className="relative" style={{ zIndex: 1 }}>
      {/* Back */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/predict"
          className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-4">

        {/* ── Hero card ────────────────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* image + title area */}
          <div className="relative flex gap-0">
            {/* text side */}
            <div className="flex-1 p-5 pr-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="chip active text-xs">
                  {pred.categoryEmoji && <span className="mr-1">{pred.categoryEmoji}</span>}
                  {pred.category}
                </span>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  จบใน{timeLeft(pred.endsAt)} ({closingLabel(pred.endsAt)})
                </span>
              </div>

              <h1 className="text-lg font-black text-[var(--text-primary)] leading-snug">
                {pred.title}
              </h1>

              {pred.description && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                  {pred.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {pred.creator[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  สร้างโดย{" "}
                  <span className="font-semibold text-purple-300">{pred.creator}</span>
                  {pred.createdAt && (
                    <span className="ml-1.5">· {timeAgoStr(pred.createdAt)}</span>
                  )}
                </span>
              </div>
            </div>

            {/* image side */}
            {pred.image_url && (
              <div className="hidden sm:block w-2/5 flex-shrink-0 relative">
                <img
                  src={pred.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-transparent to-transparent" />
              </div>
            )}
          </div>

          {/* ── VS split (modal trigger) ──────────────────── */}
          <VsModal
            predictionId={id}
            yesPct={yesPct}
            noPct={noPct}
            yesPool={pred.yesPool}
            noPool={pred.noPool}
            initialYesPool={pred.yesPool}
            initialNoPool={pred.noPool}
            endsAt={pred.endsAt}
            userVote={userVote}
          />

          {/* ── Stats row ─────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pb-4 text-sm">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Users className="w-4 h-4" />
              จำนวนผู้เข้าร่วม{" "}
              <strong className="text-[var(--text-primary)]">{pred.participants.toLocaleString()}</strong>{" "}
              คน
            </span>
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <TrendingUp className="w-4 h-4" />
              เดิมพันรวม{" "}
              <strong className="text-[var(--text-primary)]">
                {(pred.yesPool + pred.noPool).toLocaleString()}
              </strong>{" "}
              พารา
            </span>
          </div>
        </div>

        {/* Resolution reporting */}
        <ReportResolutionPanel predictionId={id} endsAt={pred.endsAt} />

        {/* ── Tabs ─────────────────────────────────────────── */}
        <TabsSection predictionId={id} description={pred.description} creator={pred.creator} endsAt={pred.endsAt} />
      </div>
      </div>
    </div>
  );
}
