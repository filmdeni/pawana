import { Plus } from "lucide-react";
import Link from "next/link";
import PredictList from "./PredictList";
import { getTrendingPredictions, PredictionRow } from "@/lib/queries/predictions";
import { Prediction } from "@/components/PredictionCard";
import { clampPct } from "@/lib/poolDisplay";

function rowToCard(r: PredictionRow): Prediction {
  const total = r.yes_pool + r.no_pool || 1;
  const yesPct = Math.round((r.yes_pool / total) * 100);
  const catEmoji: Record<string, string> = {
    drama: "💔", game: "🎮", sports: "⚽", finance: "₿", viral: "🔥", other: "✨",
  };
  return {
    id: r.id,
    title: r.title,
    category: r.categories?.label ?? "อื่นๆ",
    yesPercent: clampPct(yesPct).yes,
    noPercent: clampPct(yesPct).no,
    yesPool: r.yes_pool >= 1_000_000 ? `${(r.yes_pool / 1_000_000).toFixed(1)}M` : r.yes_pool >= 1_000 ? `${(r.yes_pool / 1_000).toFixed(0)}K` : String(r.yes_pool),
    noPool:  r.no_pool  >= 1_000_000 ? `${(r.no_pool  / 1_000_000).toFixed(1)}M` : r.no_pool  >= 1_000 ? `${(r.no_pool  / 1_000).toFixed(0)}K` : String(r.no_pool),
    participants: r.participant_count,
    timeLeft: (() => {
      const d = Math.ceil((new Date(r.ends_at).getTime() - Date.now()) / 86_400_000);
      return d > 0 ? `${d} วัน` : "1 ชั่วโมง";
    })(),
    hot: r.is_featured,
    trending: r.is_trending,
    image: catEmoji[r.categories?.slug ?? "other"] ?? "✨",
    imageUrl: r.image_url ?? undefined,
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
  const dbPredictions = await getTrendingPredictions(50).catch(() => []);
  const predictions = dbPredictions.length > 0 ? dbPredictions.map(rowToCard) : MOCK;

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black gradient-gold">คำทำนายทั้งหมด</h1>
          <p className="text-sm text-[var(--text-muted)]">เลือกหัวข้อที่คุณสนใจและทำนาย</p>
        </div>
        <Link href="/create" className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple">
          <Plus className="w-4 h-4" /> สร้างคำทำนาย
        </Link>
      </div>

      <PredictList predictions={predictions} />
    </div>
  );
}
