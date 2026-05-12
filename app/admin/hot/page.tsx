import { createClient } from "@/lib/supabase/server";
import HotPicksClient from "./HotPicksClient";
import { getHotPicks } from "@/lib/actions/hotPicks";

async function getAllPredictions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("predictions")
    .select("id, title, image_url, participant_count, ends_at, categories(label)")
    .eq("status", "approved")
    .is("resolution", null)
    .gt("ends_at", new Date().toISOString())
    .order("participant_count", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function HotPicksPage() {
  const [predictions, currentSlots] = await Promise.all([
    getAllPredictions(),
    getHotPicks(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">กำลังร้อนแรง</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">เลือก 4 การ์ดที่จะแสดงในส่วน "กำลังร้อนแรง" บนหน้าแรก</p>
      <HotPicksClient predictions={predictions as any} initialSlots={currentSlots} />
    </div>
  );
}
