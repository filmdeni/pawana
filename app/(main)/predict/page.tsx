import { Plus } from "lucide-react";
import Link from "next/link";
import PredictList from "./PredictList";
import ParallaxBg from "@/components/ParallaxBg";
import WelcomeModal from "@/components/WelcomeModal";
import DailyClaimBanner from "@/components/DailyClaimBanner";
import { getTrendingPredictions, getAwaitingResolutionPredictions, getUserVotesMap, PredictionRow } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import { getRewardState } from "@/lib/actions/rewards";
import PredictionCard, { Prediction } from "@/components/PredictionCard";
import { clampPct } from "@/lib/poolDisplay";

function formatPool(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const COIN_KEYWORDS: { keys: string[]; symbol: string }[] = [
  { keys: ["bitcoin", "btc"],     symbol: "BTC" },
  { keys: ["ethereum", "eth"],    symbol: "ETH" },
  { keys: ["solana", "sol"],      symbol: "SOL" },
  { keys: ["xrp", "ripple"],      symbol: "XRP" },
  { keys: ["bnb"],                symbol: "BNB" },
  { keys: ["dogecoin", "doge"],   symbol: "DOGE" },
];

function detectCoinSymbol(title: string, subcategory: string | null): string | undefined {
  const lower = (title + " " + (subcategory ?? "")).toLowerCase();
  for (const { keys, symbol } of COIN_KEYWORDS) {
    if (keys.some(k => lower.includes(k))) return symbol;
  }
  return undefined;
}

function formatTimeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "เฉลยแล้ว";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs} ชั่วโมง`;
  const days = Math.ceil(diff / 86400000);
  return `${days} วัน`;
}

function rowToCard(r: PredictionRow): Prediction {
  const catEmoji: Record<string, string> = {
    drama: "💔", game: "🎮", sports: "⚽", finance: "₿", viral: "🔥", other: "✨",
  };

  const isMulti = Array.isArray(r.options) && r.options.length > 2;
  let options: { label: string; percent: number }[] | undefined;

  if (isMulti && r.options) {
    const pools = r.option_pools ?? r.options.map(() => 0);
    const poolTotal = pools.reduce((s, v) => s + v, 0);
    const equalPct = Math.round(100 / r.options.length);
    options = r.options.map((label, i) => ({
      label,
      percent: poolTotal > 0 ? Math.round(((pools[i] ?? 0) / poolTotal) * 100) : equalPct,
    }));
  }

  const total = r.yes_pool + r.no_pool || 1;
  const yesPct = Math.round((r.yes_pool / total) * 100);
  const coinSymbol = detectCoinSymbol(r.title, (r as { subcategory?: string | null }).subcategory ?? null);

  const diffMs = new Date(r.ends_at).getTime() - Date.now();
  const predictionType: "quick" | "standard" | "epic" | undefined =
    diffMs <= 30 * 60_000      ? "quick" :
    diffMs >= 30 * 86_400_000  ? "epic"  :
    undefined;

  return {
    id: r.id,
    title: r.title,
    category: r.categories?.label ?? "อื่นๆ",
    yesPercent: clampPct(yesPct).yes,
    noPercent: clampPct(yesPct).no,
    yesPool: formatPool(r.yes_pool),
    noPool:  formatPool(r.no_pool),
    yesPoolRaw: r.yes_pool,
    noPoolRaw:  r.no_pool,
    participants: r.participant_count,
    timeLeft: formatTimeLeft(r.ends_at),
    endsAt: r.ends_at,
    coinSymbol,
    subcategory: (r as { subcategory?: string | null }).subcategory ?? null,
    hot: r.is_featured,
    trending: r.is_trending,
    image: catEmoji[r.categories?.slug ?? "other"] ?? "✨",
    imageUrl: r.image_url ?? undefined,
    imagePosition: r.image_position ?? "50% 50%",
    predictionType,
    yesLabel: r.yes_label ?? "ใช่",
    noLabel: r.no_label ?? "ไม่",
    ...(options ? { options } : {}),
  };
}

const MOCK: Prediction[] = [
  { id: "1", title: "GTA 6 จะทำรายได้ทะลุ 1 พันล้านดอลลาร์ใน 24 ชม. จริงไหม?", category: "เกม", yesPercent: 78, noPercent: 22, yesPool: "2.4M", noPool: "670K", participants: 2400, timeLeft: "120 วัน", hot: true, image: "🎮" },
  { id: "2", title: "ดราม่าเดือด! อินฟลูเอนเซอร์ A จะออกมาขอโทษไทยจริงไหม?", category: "ดราม่า", yesPercent: 63, noPercent: 37, yesPool: "1.2M", noPool: "700K", participants: 1800, timeLeft: "3 วัน", trending: true, image: "🔥" },
  { id: "3", title: "Bitcoin จะพุ่งทะลุ 100,000 ดอลลาร์ภายในปีนี้?", category: "การเงิน", yesPercent: 55, noPercent: 45, yesPool: "5.6M", noPool: "4.6M", participants: 12000, timeLeft: "200 วัน", image: "₿" },
  { id: "4", title: "ใครจะเป็นแชมเปี้ยน League of Legends ปีนี้?", category: "เกม", yesPercent: 48, noPercent: 52, yesPool: "980K", noPool: "1.1M", participants: 3200, timeLeft: "60 วัน", image: "🏆" },
  { id: "5", title: "เฌอปราง BNK48 จะประกาศข่าวดีในปีนี้ไหม?", category: "ดราม่า", yesPercent: 70, noPercent: 30, yesPool: "870K", noPool: "370K", participants: 4500, timeLeft: "8 วัน", hot: true, image: "🌟" },
  { id: "6", title: "เงินบาทจะแข็งค่าขึ้นในโคมาส 3 นี้หรือไม่?", category: "การเงิน", yesPercent: 43, noPercent: 57, yesPool: "650K", noPool: "860K", participants: 1900, timeLeft: "10 วัน", image: "💴" },
];

export default async function PredictPage() {
  const [dbPredictions, dbAwaiting, user, rewardState] = await Promise.all([
    getTrendingPredictions(50, false).catch(() => []),
    getAwaitingResolutionPredictions(20).catch(() => []),
    getSessionUser().catch(() => null),
    getRewardState().catch(() => null),
  ]);

  let votesMap: Record<string, { choiceLabel: string; amount: number }> = {};
  if (user && dbPredictions.length > 0) {
    const raw = await getUserVotesMap(dbPredictions.map((r) => r.id), user.id);
    for (const [pid, v] of Object.entries(raw)) {
      const row = dbPredictions.find((r) => r.id === pid);
      const label = v.choice_index != null
        ? (row?.options?.[v.choice_index] ?? (v.choice ? row?.yes_label ?? "ใช่" : row?.no_label ?? "ไม่ใช่"))
        : (v.choice ? row?.yes_label ?? "ใช่" : row?.no_label ?? "ไม่ใช่");
      votesMap[pid] = { choiceLabel: label, amount: v.amount };
    }
  }

  const predictions = dbPredictions.length > 0
    ? dbPredictions.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }))
    : MOCK;

  const awaitingPredictions = dbAwaiting.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }));

  return (
    <div className="relative">
      <ParallaxBg />
      {rewardState?.isNewUser && (
        <WelcomeModal isNewUser coins={rewardState.coins} />
      )}
    <div className="relative p-4 md:p-6 max-w-screen-xl mx-auto" style={{ zIndex: 1 }}>
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-black gradient-gold">คำทำนายทั้งหมด</h1>
          <p className="text-sm text-[var(--text-muted)]">เลือกหัวข้อที่คุณสนใจและทำนาย</p>
        </div>
        <Link href="/create" className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple flex-shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">สร้างคำทำนาย</span><span className="sm:hidden">สร้าง</span>
        </Link>
      </div>

      {rewardState?.canClaimDaily && <DailyClaimBanner canClaim />}
      <PredictList predictions={predictions} />

      {awaitingPredictions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⏳</span>
            <h2 className="text-base font-bold text-[var(--text-primary)]">รอเฉลย</h2>
            <span className="text-xs text-[var(--text-muted)] bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{awaitingPredictions.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {awaitingPredictions.map((p) => <PredictionCard key={p.id} p={p} showComments />)}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
