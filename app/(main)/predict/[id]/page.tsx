import Link from "next/link";
import { ArrowLeft, Clock, Users, TrendingUp } from "lucide-react";
import ReportResolutionPanel from "@/components/ReportResolutionPanel";
import ResultRevealOverlay from "@/components/ResultRevealOverlay";
import ParallaxBg from "@/components/ParallaxBg";
import { getPredictionById, getUserVote, getRelatedPredictions } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import TabsSection from "./TabsSection";
import VsModal from "./VsModal";
import CryptoPriceChart from "@/components/CryptoPriceChart";
import CinematicPoolBar from "@/components/CinematicPoolBar";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vote?: string }>;
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

const SPORTS_CATEGORIES = ["กีฬา", "มวย", "ฟุตบอล", "บาสเกตบอล", "e-sport", "sport"];
const CRYPTO_CATEGORIES = ["การเงิน", "finance", "crypto", "cryptocurrency", "หุ้น", "bitcoin"];
const CRYPTO_SUBCATS = new Set(["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)", "XRP", "BNB", "Dogecoin (DOGE)"]);

const COIN_MAP: Record<string, { id: string; symbol: string; name: string }> = {
  bitcoin: { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  btc: { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  ethereum: { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  eth: { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  solana: { id: "solana", symbol: "SOL", name: "Solana" },
  sol: { id: "solana", symbol: "SOL", name: "Solana" },
  xrp: { id: "ripple", symbol: "XRP", name: "XRP" },
  bnb: { id: "binancecoin", symbol: "BNB", name: "BNB" },
  doge: { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  dogecoin: { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
};

function detectCoin(text: string): { id: string; symbol: string; name: string } | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(COIN_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

async function fetchCryptoPrices(coinId: string): Promise<{ date: string; price: number }[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json() as { prices: [number, number][] };
    return json.prices.map(([ts, price]) => ({
      date: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: Math.round(price * 100) / 100,
    }));
  } catch {
    return [];
  }
}

function buildMockChartData(options: string[], pools: number[], endsAt: string, createdAt?: string | null) {
  const now = Date.now();
  const start = createdAt ? new Date(createdAt).getTime() : now - 30 * 86400000;
  const end = Math.min(new Date(endsAt).getTime(), now);
  const days = Math.max(Math.round((end - start) / 86400000), 7);
  const points = Math.min(days, 60);
  const step = (end - start) / points;

  const total = pools.reduce((s, v) => s + v, 0) || 1;
  const finalPcts = pools.map((p) => Math.round((p / total) * 100));

  // seed random walk from 1/n each to finalPcts
  const n = options.length;
  const series: number[][] = options.map((_, i) => {
    const arr: number[] = [];
    const init = Math.round(100 / n);
    for (let t = 0; t <= points; t++) {
      const progress = t / points;
      // lerp + noise
      const base = init + (finalPcts[i] - init) * progress;
      const noise = (Math.sin(t * 1.7 + i * 3.1) * 6 + Math.cos(t * 0.9 + i) * 4) * (1 - progress * 0.6);
      arr.push(Math.max(1, Math.min(99, Math.round(base + noise))));
    }
    return arr;
  });

  return Array.from({ length: points + 1 }, (_, t) => {
    const d = new Date(start + step * t);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const row: Record<string, string | number> = { date: label };
    options.forEach((opt, i) => { row[opt] = series[i][t]; });
    return row;
  });
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

export default async function PredictDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { vote }] = await Promise.all([params, searchParams]);
  const voteNum = vote !== undefined && !isNaN(parseInt(vote)) ? parseInt(vote) : null;
  const preselect: boolean | null =
    vote === "yes" || voteNum === 0 ? true :
    vote === "no"  || voteNum === 1 ? false :
    null;
  const preselectIndex: number | null = voteNum;

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
        housePool: dbPred.house_pool ?? 500,
        maxBet: dbPred.max_bet ?? 1000,
        participants: dbPred.participant_count,
        endsAt: dbPred.ends_at,
        creator: dbPred.profiles?.display_name ?? dbPred.profiles?.username ?? "unknown",
        hot: dbPred.is_featured,
        image_url: dbPred.image_url,
        image_position: dbPred.image_position ?? "50% 50%",
        yesLabel: dbPred.yes_label ?? "ใช่",
        noLabel: dbPred.no_label ?? "ไม่ใช่",
        options: dbPred.options ?? null,
        optionPools: dbPred.option_pools ?? null,
        showChart: dbPred.show_chart !== false,
        subcategory: dbPred.subcategory ?? null,
        createdAt: null as string | null,
      }
    : { ...(MOCK_FALLBACK[id] ?? MOCK_FALLBACK["1"]), categoryEmoji: "", createdAt: null as string | null, options: null, optionPools: null, showChart: true, subcategory: null };

  const categorySlug = dbPred?.categories?.slug ?? null;
  const [userVote, userProfile, relatedRaw] = await Promise.all([
    user && dbPred ? getUserVote(dbPred.id, user.id).catch(() => null) : Promise.resolve(null),
    user ? (async () => {
      const supabase = await createClient();
      const { data } = await supabase.from("profiles").select("xp, level, coins").eq("id", user.id).single();
      return data;
    })().catch(() => null) : Promise.resolve(null),
    getRelatedPredictions(id, categorySlug, 3).catch(() => []),
  ]);

  const related = relatedRaw.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.categories?.label ?? "อื่นๆ",
    categoryEmoji: r.categories?.emoji ?? "",
    endsAt: r.ends_at,
  }));

  const effYes = pred.yesPool + (pred.housePool ?? 500);
  const effNo  = pred.noPool  + (pred.housePool ?? 500);
  const total = effYes + effNo;
  const yesPct = Math.round((effYes / total) * 100);
  const noPct = 100 - yesPct;

  const isSports = SPORTS_CATEGORIES.some((c) => pred.category.toLowerCase().includes(c.toLowerCase()));
  const isCrypto = CRYPTO_CATEGORIES.some((c) => pred.category.toLowerCase().includes(c.toLowerCase()));
  const chartOpts: string[] = pred.options && pred.options.length > 0
    ? (pred.options as string[])
    : [pred.yesLabel ?? "ใช่", pred.noLabel ?? "ไม่ใช่"];
  const chartPools: number[] = pred.optionPools && pred.optionPools.length > 0
    ? (pred.optionPools as number[])
    : [pred.yesPool, pred.noPool];
  const chartData = isSports ? buildMockChartData(chartOpts, chartPools, pred.endsAt, pred.createdAt) : null;

  const isCryptoSubcat = pred.subcategory ? CRYPTO_SUBCATS.has(pred.subcategory) : isCrypto;
  const detectedCoin = isCryptoSubcat
    ? (detectCoin(pred.title + " " + pred.description + " " + (pred.subcategory ?? "")) ?? COIN_MAP["bitcoin"])
    : null;
  const cryptoPrices = detectedCoin ? await fetchCryptoPrices(detectedCoin.id) : [];

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
                {new Date(pred.endsAt).getTime() - Date.now() <= 0 ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg ml-auto text-xs font-bold"
                    style={{ background: "rgba(94,211,166,0.1)", border: "1px solid rgba(94,211,166,0.25)", color: "#5ED3A6" }}>
                    ✓ หมดเวลาแล้ว · {closingLabel(pred.endsAt)}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    จบใน{timeLeft(pred.endsAt)} ({closingLabel(pred.endsAt)})
                  </span>
                )}
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
                  style={{ objectPosition: pred.image_position ?? "50% 50%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-transparent to-transparent" />
              </div>
            )}
          </div>

          {/* ── Cinematic pool bar ───────────────────────── */}
          <div className="px-5 pt-4 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <CinematicPoolBar
              yesPct={yesPct}
              noPct={noPct}
              yesPool={pred.yesPool}
              noPool={pred.noPool}
              live
              yesLabel={pred.yesLabel ?? "ใช่"}
              noLabel={pred.noLabel ?? "ไม่ใช่"}
              options={pred.options as string[] | null}
              optionPools={pred.optionPools as number[] | null}
            />
          </div>

          {/* ── Stats row ─────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 mx-4 mb-4 rounded-xl border border-white/5 bg-white/[0.03] text-sm">
            <span className="flex items-center gap-2 text-[var(--text-muted)]">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                คนทายแล้ว{" "}
                <strong className="text-[var(--text-primary)]">{pred.participants.toLocaleString()}</strong>
                {" "}คน
              </span>
            </span>
            <span className="flex items-center gap-2 text-[var(--text-muted)]">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span>
                เดิมพันรวม{" "}
                <strong className="text-[var(--text-primary)]">
                  {(pred.yesPool + pred.noPool).toLocaleString()}
                </strong>
                {" "}
                <img src="/images/point2.png" alt="ญาณ" className="inline w-3.5 h-3.5 object-contain align-middle" />
              </span>
            </span>
          </div>
        </div>

        {/* ── Vote / Sports card ────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          {pred.showChart && detectedCoin && cryptoPrices.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <CryptoPriceChart
                symbol={detectedCoin.symbol}
                coinName={detectedCoin.name}
                data={cryptoPrices}
              />
            </div>
          )}
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
            isLoggedIn={!!user}
            yesLabel={pred.yesLabel}
            noLabel={pred.noLabel}
            options={pred.options}
            optionPools={pred.optionPools}
            userXp={userProfile?.xp ?? 0}
            userLevel={userProfile?.level ?? 1}
            userBalance={userProfile?.coins ?? 0}
            housePool={pred.housePool}
            predMaxBet={pred.maxBet}
            initialChoice={preselect}
            initialChoiceIndex={preselectIndex}
            isSports={isSports}
            chartData={chartData ?? undefined}
            chartOptions={isSports ? chartOpts : undefined}
          />
        </div>

        {/* Result reveal overlay — shows just_voted feedback + win/lose after resolution */}
        {dbPred && (
          <ResultRevealOverlay
            predictionId={id}
            initialResolution={dbPred.resolution ?? null}
            initialResolutionIndex={dbPred.resolution_index ?? null}
            userVote={userVote}
            rewardClaimed={userVote?.reward_claimed ?? false}
            rewardAmount={userVote?.reward_amount ?? 0}
            yesLabel={pred.yesLabel ?? "ใช่"}
            noLabel={pred.noLabel ?? "ไม่ใช่"}
            options={pred.options as string[] | null}
            predictionTitle={pred.title}
            related={related}
          />
        )}

        {/* Resolution reporting — only for real DB predictions */}
        {dbPred && (
          <ReportResolutionPanel
            predictionId={id}
            endsAt={pred.endsAt}
            resolution={dbPred.resolution ?? null}
            yesLabel={pred.yesLabel ?? "ใช่"}
            noLabel={pred.noLabel ?? "ไม่ใช่"}
          />
        )}

        {/* ── Tabs ─────────────────────────────────────────── */}
        <TabsSection predictionId={id} description={pred.description} creator={pred.creator} endsAt={pred.endsAt} />
      </div>
      </div>

    </div>
  );
}
