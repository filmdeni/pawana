import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import StatsBar from "@/components/StatsBar";
import { Flame, TrendingUp, Zap, ChevronRight, MessageSquare, Timer, Sparkles } from "lucide-react";
import PredictionCard, { Prediction } from "@/components/PredictionCard";
import LiveHeroCard from "@/components/LiveHeroCard";
import ParallaxBg from "@/components/ParallaxBg";
import { getTrendingPredictions, getQuickPredictions, getEndingSoonPredictions, getForYouPredictions, getUserVotesMap, getLeaderboard, getUserWorldRank, PredictionRow } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import { clampPct } from "@/lib/poolDisplay";
import { getHomeSections } from "@/lib/actions/appConfig";

function rowToCard(r: PredictionRow): Prediction {
  const total = r.yes_pool + r.no_pool || 1;
  const yesPct = Math.round((r.yes_pool / total) * 100);
  const msLeft = new Date(r.ends_at).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  const hoursLeft = Math.ceil(msLeft / 3_600_000);
  const timeLeft = daysLeft > 1 ? `${daysLeft} วัน` : hoursLeft > 0 ? `${hoursLeft} ชั่วโมง` : "หมดเวลา";
  const catEmoji: Record<string, string> = {
    drama: "💔", game: "🎮", sports: "⚽", finance: "₿", viral: "🔥", other: "✨",
  };
  const predictionType: "quick" | "standard" | "epic" | undefined =
    msLeft <= 60 * 60_000       ? "quick" :
    msLeft >= 30 * 86_400_000   ? "epic"  :
    undefined;

  const isMulti = Array.isArray(r.options) && r.options.length > 2;
  let multiOptions: { label: string; percent: number }[] | undefined;
  if (isMulti && r.options) {
    const pools = r.option_pools ?? r.options.map(() => 0);
    const poolTotal = pools.reduce((s, v) => s + v, 0);
    const equalPct = Math.round(100 / r.options.length);
    multiOptions = r.options.map((label, i) => ({
      label,
      percent: poolTotal > 0 ? Math.round(((pools[i] ?? 0) / poolTotal) * 100) : equalPct,
    }));
  }

  return {
    id: r.id,
    title: r.title,
    category: r.categories?.label ?? "อื่นๆ",
    yesPercent: clampPct(yesPct).yes,
    noPercent: clampPct(yesPct).no,
    yesPool: r.yes_pool >= 1_000_000 ? `${(r.yes_pool / 1_000_000).toFixed(1)}M` : r.yes_pool >= 1_000 ? `${(r.yes_pool / 1_000).toFixed(0)}K` : String(r.yes_pool),
    noPool:  r.no_pool  >= 1_000_000 ? `${(r.no_pool  / 1_000_000).toFixed(1)}M` : r.no_pool  >= 1_000 ? `${(r.no_pool  / 1_000).toFixed(0)}K` : String(r.no_pool),
    participants: r.participant_count,
    timeLeft,
    endsAt: r.ends_at,
    predictionType,
    subcategory: (r as { subcategory?: string | null }).subcategory ?? null,
    hot: r.is_featured,
    trending: r.is_trending,
    image: catEmoji[r.categories?.slug ?? "other"] ?? "✨",
    imageUrl: r.image_url ?? undefined,
    imagePosition: r.image_position ?? "50% 50%",
    resolution: (r as { resolution?: boolean | null }).resolution ?? null,
    resolvedAt: (r as { resolved_at?: string | null }).resolved_at ?? null,
    yesLabel: r.yes_label ?? "ใช่",
    noLabel: r.no_label ?? "ไม่",
    ...(multiOptions ? { options: multiOptions } : {}),
  };
}

const MOCK: Prediction[] = [
  { id: "1", title: "ดราม่าคู่รักดังคู่นี้จะเลิกกันภายในปี 2024 ไหม?", category: "ดราม่า", yesPercent: 72, noPercent: 28, yesPool: "1.2M", noPool: "467K",  participants: 12300, timeLeft: "25 วัน",  hot: true,      image: "💔", totalPool: "2.4M" },
  { id: "2", title: "GTA 6 จะเปิดตัวภายในปี 2025 ไหม?",                 category: "เกม",    yesPercent: 64, noPercent: 36, yesPool: "2.8M", noPool: "1.6M",  participants: 8700,  timeLeft: "189 วัน", trending: true, image: "🎮", totalPool: "2.8M" },
  { id: "3", title: "ลิเวอร์พูลจะคว้าแชมป์พรีเมียร์ลีก 2024/25 ไหม?", category: "กีฬา",  yesPercent: 58, noPercent: 42, yesPool: "1.8M", noPool: "1.3M",  participants: 6200,  timeLeft: "132 วัน",              image: "⚽", totalPool: "1.8M" },
  { id: "4", title: "TikTok จะถูกแบนโดยรัฐบาลไทย ภายในปี 2025 ไหม?",   category: "ไวรัล", yesPercent: 41, noPercent: 59, yesPool: "970K", noPool: "1.4M",  participants: 4100,  timeLeft: "67 วัน",  hot: true,      image: "📱", totalPool: "970K"  },
];

const MOCK_MISSIONS = [
  { label: "ทำนาย 3 หัวข้อ",       progress: 2, total: 3, reward: 150, icon: "🔮", done: false },
  { label: "แสดงความคิดเห็น",      progress: 0, total: 5, reward: 100, icon: "💬", done: false },
  { label: "แชร์คำทำนาย 1 ครั้ง", progress: 0, total: 1, reward: 200, icon: "📤", done: false },
  { label: "ล็อกอินวันนี้",        progress: 1, total: 1, reward: 50,  icon: "✅", done: true  },
];

const MOCK_LEADERS = [
  { name: "TheOracle",   coins: "2.45M", rank: 1, accuracy: 92 },
  { name: "SageOne",     coins: "1.87M", rank: 2, accuracy: 89 },
  { name: "VisionaryX",  coins: "1.56M", rank: 3, accuracy: 88 },
  { name: "FourthSight", coins: "1.25M", rank: 4, accuracy: 85 },
  { name: "LunarMind",   coins: "1.12M", rank: 5, accuracy: 84 },
];

const MOCK_POSTS = [
  { title: "โตรดกาว+บิ้ว The Toast จะได้ 100 ล้านวิว?", comments: 125, ago: "2 ชั่วโมงที่แล้ว" },
  { title: "สรุปดราม่าใหญ่วันนี้ โตรมิล ใครถูก?",       comments: 96,  ago: "3 ชั่วโมงที่แล้ว" },
  { title: "มุมมองของคุณต่อเรื่องนี้?",                 comments: 77,  ago: "5 ชั่วโมงที่แล้ว" },
];

const RANK_BADGE: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

async function TrendingSection() {
  const [dbPredictions, user] = await Promise.all([
    getTrendingPredictions(4).catch(() => []),
    getSessionUser().catch(() => null),
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

  const predictions: Prediction[] = dbPredictions.length > 0
    ? dbPredictions.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }))
    : MOCK;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
      {predictions.map((p) => (
        <PredictionCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="shimmer rounded-xl h-52" />
      ))}
    </div>
  );
}

function LiveSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <div className="col-span-2 md:col-span-2 shimmer rounded-xl h-52" />
      <div className="shimmer rounded-xl h-52" />
      <div className="shimmer rounded-xl h-52" />
    </div>
  );
}

function EndingSoonSkeleton() {
  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1 scrollbar-none">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[82vw] sm:w-[62vw] md:w-[calc(33%-8px)]">
          <div className="shimmer rounded-xl h-52" />
        </div>
      ))}
    </div>
  );
}

function ForYouSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <div className="col-span-2 md:col-span-1 shimmer rounded-xl h-52" />
      <div className="shimmer rounded-xl h-52" />
      <div className="shimmer rounded-xl h-52" />
    </div>
  );
}

async function QuickSection() {
  const [dbPredictions, user] = await Promise.all([
    getQuickPredictions(4).catch(() => []),
    getSessionUser().catch(() => null),
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

  const predictions: Prediction[] = dbPredictions.length > 0
    ? dbPredictions.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }))
    : MOCK.slice(0, 4);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
      {predictions.map((p, i) => (
        <div key={p.id} className={i === 0 ? "col-span-2 md:col-span-2" : ""}>
          <PredictionCard p={p} />
        </div>
      ))}
    </div>
  );
}

async function EndingSoonSection() {
  const [dbPredictions, user] = await Promise.all([
    getEndingSoonPredictions(4).catch(() => []),
    getSessionUser().catch(() => null),
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

  const predictions: Prediction[] = dbPredictions.length > 0
    ? dbPredictions.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }))
    : MOCK.slice(0, 4);

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
      {predictions.map((p) => (
        <div key={p.id} className="flex-shrink-0 w-[72vw] sm:w-[52vw] md:w-[calc(33%-6px)] snap-start">
          <PredictionCard p={p} />
        </div>
      ))}
    </div>
  );
}

async function ForYouSection() {
  const [dbPredictions, user] = await Promise.all([
    getForYouPredictions(4).catch(() => []),
    getSessionUser().catch(() => null),
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

  const predictions: Prediction[] = dbPredictions.length > 0
    ? dbPredictions.map((r) => ({ ...rowToCard(r), userVote: votesMap[r.id] ?? null }))
    : [...MOCK].reverse().slice(0, 4);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
      {predictions.map((p) => (
        <div key={p.id}>
          <PredictionCard p={p} />
        </div>
      ))}
    </div>
  );
}

async function UserRankCard() {
  const user = await getSessionUser().catch(() => null);
  const rankData = user ? await getUserWorldRank(user.id).catch(() => null) : null;
  const worldRank = rankData ? `#${rankData.rank.toLocaleString()}` : "-";
  const coins = rankData ? rankData.coins.toLocaleString() : "-";
  const accuracy = rankData ? `${rankData.accuracy_pct}%` : "-";
  return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0 flex flex-col"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Top: #121318 */}
      <div className="flex items-center gap-5 px-5 py-4" style={{ background: "#121518" }}>
        <div className="relative w-[130px] h-[130px] flex-shrink-0">
          <Image
            src="/images/logorank2.png"
            alt="rank"
            fill
            sizes="130px"
            className="object-contain"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-[11px] text-[#6B6585] tracking-wide">นักพยากรณ์ระดับ</p>
          <p className="text-[20px] font-black leading-tight" style={{ color: "#feef9d" }}>จักรวาลเริ่มจ้องมอง</p>
          <div className="mt-1">
            <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: "49%", background: "linear-gradient(90deg, #7C3AED, #A78BFA)" }} />
            </div>
            <p className="text-[10px] text-[#6B6585] mt-2 text-center tracking-wide">2,450 / 5,000 XP</p>
          </div>
        </div>
      </div>
      {/* Bottom */}
      <div className="px-3 py-3" style={{ background: "#101115" }}>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "อันดับโลก",     value: worldRank },
            { label: "พาวนาคงเหลือ", value: coins },
            { label: "อัตราความแม่น", value: accuracy },
          ].map((s) => (
            <div key={s.label} className="rounded-lg py-2.5 flex flex-col items-center gap-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] text-[#6B6585] leading-none text-center">{s.label}</p>
              <p className="text-[13px] font-bold text-white leading-none">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserRankSkeleton() {
  return <div className="shimmer rounded-2xl flex-[28] min-h-0" style={{ height: "180px" }} />;
}

async function LeaderboardWidget() {
  const leaders = await getLeaderboard(5).catch(() => []);
  const ranked = leaders
    .sort((a: { coins: number }, b: { coins: number }) => b.coins - a.coins)
    .slice(0, 5)
    .map((u: { id: string; display_name: string | null; username: string; coins: number; accuracy_pct: number }, i: number) => ({
      ...u,
      rank: i + 1,
      name: u.display_name ?? u.username,
    }));

  return (
    <div className="rounded-2xl p-4 border border-white/5 flex-shrink-0 flex flex-col" style={{ background: "#101115" }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="section-heading">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-bold">นักพยากรณ์ยอดนิยม</h2>
        </div>
        <Link href="/ranking" className="see-all-link">
          ดูทั้งหมด <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        {ranked.map((u: { rank: number; name: string; coins: number; accuracy_pct: number }) => (
          <div key={u.rank}
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-white/[0.03]"
            style={u.rank <= 3 ? {
              background: "rgba(215,181,109,0.04)",
              border: "1px solid rgba(215,181,109,0.12)",
            } : undefined}
          >
            <span className="w-5 text-center flex-shrink-0 text-sm font-black"
              style={!RANK_BADGE[u.rank] ? { color: "var(--text-muted)", fontSize: "10px" } : undefined}>
              {RANK_BADGE[u.rank] ?? `#${u.rank}`}
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4B3975, #6F4BFF)" }}>
              {u.name[0]?.toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</span>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Image src="/images/point2.png" alt="point" width={14} height={14} />
                <p className="text-xs font-black" style={{ color: "#D7B56D" }}>{u.coins.toLocaleString()}</p>
              </div>
              <p className="text-[10px]" style={{ color: "#5ED3A6" }}>{u.accuracy_pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const s = await getHomeSections().catch(() => null);
  const show = (key: keyof NonNullable<typeof s>) => !s || s[key] !== false;

  return (
    <div className="relative">
      <ParallaxBg variant="indigo" />
    <div
      className="relative grid gap-5 p-4 md:p-5 grid-cols-1 md:grid-cols-[58fr_27fr]"
      style={{ zIndex: 1 }}
    >
      {/* MAIN CONTENT */}
      <div className="min-w-0 space-y-5 md:space-y-6">

        {/* Hero — LIVE prediction card */}
        {show("hero") && <LiveHeroCard />}

        {/* Stats bar */}
        {show("stats_bar") && <StatsBar />}

        {/* 1. ทายไว */}
        {show("quick") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading">
              <Zap className="w-4 h-4 text-red-400" style={{ animation: "live-pulse 1s ease-in-out infinite" }} />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">คนกำลังทาย</h2>
              <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest"
                style={{ background: "rgba(220,30,30,0.25)", border: "1px solid rgba(220,60,60,0.60)", color: "#ff7070" }}>
                <span className="card-live-dot" />
                LIVE
              </span>
            </div>
            <Link href="/predict" className="see-all-link">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Suspense fallback={<LiveSkeleton />}>
            <QuickSection />
          </Suspense>
        </section>
        )}

        {/* 2. กระแสแรง */}
        {show("trending") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading">
              <Flame className="w-4 h-4 text-orange-400 fire-flicker" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">กระแสแรง</h2>
            </div>
            <Link href="/predict" className="see-all-link">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Suspense fallback={<TrendingSkeleton />}>
            <TrendingSection />
          </Suspense>
        </section>
        )}

        {/* 3. ใกล้เฉลย */}
        {show("ending_soon") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading">
              <Timer className="w-4 h-4 text-amber-400" style={{ animation: "live-pulse 1.4s ease-in-out infinite" }} />
              <h2 className="text-sm font-bold" style={{ color: "#fbbf24" }}>ใกล้เฉลย</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide"
                style={{ background: "rgba(251,146,60,0.2)", border: "1px solid rgba(251,146,60,0.5)", color: "#fb923c" }}>
                ⏳ ENDING SOON
              </span>
            </div>
            <Link href="/predict" className="see-all-link">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Suspense fallback={<EndingSoonSkeleton />}>
            <EndingSoonSection />
          </Suspense>
        </section>
        )}

        {/* 4. เพื่อคุณ */}
        {show("for_you") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">เพื่อคุณ</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}>
                🧠 AI PICKS
              </span>
            </div>
            <Link href="/predict" className="see-all-link">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Suspense fallback={<ForYouSkeleton />}>
            <ForYouSection />
          </Suspense>
        </section>
        )}

        {/* Daily Missions */}
        {show("missions") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">ภารกิจประจำวัน</h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">รีเซ็ตใหม่ 12:45:30</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch">
            {MOCK_MISSIONS.map((m, i) => {
              const pct = Math.min((m.progress / m.total) * 100, 100);
              return (
                <div key={i}
                  className={`rounded-xl p-3.5 border flex flex-col gap-2 ${
                    m.done ? "border-yellow-500/30" : "glass border-[rgba(124,58,237,0.2)]"
                  }`}
                  style={m.done ? { background: "linear-gradient(135deg,rgba(234,179,8,.12),rgba(180,83,9,.06))" } : {}}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-[11px] font-bold text-yellow-400 inline-flex items-center gap-0.5 flex-shrink-0">+{m.reward} <Image src="/images/point2.png" alt="point" width={12} height={12} className="flex-shrink-0" /></span>
                  </div>
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-snug flex-1">{m.label}</p>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        m.done ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                               : "bg-gradient-to-r from-purple-600 to-violet-400"
                      }`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)]">{m.progress}/{m.total}</span>
                    {m.done && <span className="text-[10px] font-bold text-yellow-400">รับแล้ว ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Shop Preview */}
        {show("shop") && (
        <section
          className="rounded-2xl overflow-hidden border border-[rgba(244,194,74,0.2)] relative"
          style={{ background: "linear-gradient(135deg,rgba(76,29,149,.5) 0%,rgba(18,18,31,.95) 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 15% 50%,rgba(244,194,74,.07) 0%,transparent 55%)" }} />
          <div className="relative z-10 p-5 flex items-center gap-5">
            <div className="text-5xl flex-shrink-0">🎁</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-yellow-400/70 mb-0.5 tracking-widest uppercase">ร้านค้าพาวนา</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">ใช้พาวนาแลกรับไอเทมพิเศษและตกแต่งนักพยากรณ์ของคุณ</p>
              <Link href="/shop"
                className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold border border-yellow-500/40 text-yellow-400 hover:bg-yellow-400/10 transition-all">
                เข้าร้านค้า
              </Link>
            </div>
            <div className="hidden md:flex gap-2 flex-shrink-0">
              {[
                { name: "กรอบโปรไฟล์จักรวาล",    price: "5,000",  icon: "🖼️" },
                { name: "ตราสัญลักษณ์นักพยากรณ์", price: "10,000", icon: "🏅" },
                { name: "เอฟเฟกต์คอมเมนต์",       price: "3,000",  icon: "✨" },
                { name: "โดมหินทิพย์",             price: "7,500",  icon: "💎" },
              ].map((item) => (
                <div key={item.name} className="glass rounded-xl p-2.5 text-center w-[72px] flex-shrink-0 card-hover">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-[9px] text-[var(--text-muted)] leading-tight">{item.name}</p>
                  <p className="text-[10px] font-bold text-yellow-400 mt-0.5 flex items-center justify-center gap-0.5"><Image src="/images/point2.png" alt="point" width={10} height={10} /> {item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div
        className="min-w-0 md:sticky md:top-14 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:h-[calc(100vh-56px)] pb-2 md:pb-0 snap-x snap-mandatory md:snap-none"
      >
        {/* User Rank Card */}
        {show("rank_card") && (
          <Suspense fallback={<UserRankSkeleton />}>
            <UserRankCard />
          </Suspense>
        )}

        {/* Top Predictors Leaderboard */}
        {show("leaderboard") && (
          <Suspense fallback={<div className="shimmer rounded-2xl" style={{ height: "260px" }} />}>
            <LeaderboardWidget />
          </Suspense>
        )}

        {/* Community Trending Panel */}
        {show("community") && (
        <div className="rounded-2xl p-4 border border-white/5 flex-shrink-0 flex flex-col" style={{ background: "#101115" }}>
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="section-heading">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold">กระแสล่าสุดในชุมชน</h2>
            </div>
            <Link href="/board" className="see-all-link">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {MOCK_POSTS.map((post, i) => (
              <Link href="/board" key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-purple-100 transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" /> {post.comments}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{post.ago}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

        <div className="flex-[10]" />
      </div>
    </div>
    </div>
  );
}
