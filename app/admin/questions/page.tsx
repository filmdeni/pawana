import { createClient } from "@/lib/supabase/server";
import QuestionsClient from "./QuestionsClient";

export default async function AdminQuestionsPage() {
  const supabase = await createClient();
  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, title, description, status, resolution, yes_pool, no_pool, participant_count, ends_at, created_at, is_featured, is_trending, image_url, image_position, category_id, subcategory, yes_label, no_label, profiles(username)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">จัดการคำถาม</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">อนุมัติ / ปฏิเสธ / เฉลย / ลบ</p>
      <QuestionsClient predictions={predictions ?? []} />
    </div>
  );
}
