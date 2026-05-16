"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface HeroSlideInput {
  lines: string[];
  category_id: number;
  category: string;
  yes_pct: number;
  yes_label: string;
  no_label: string;
  yes_btn: string;
  no_btn: string;
  duration_hours: number;
  viewers: number;
  heat_level: number;
  bg_image: string;
  bg_position: string;
  active: boolean;
}

export async function createHeroSlideWithPrediction(
  input: HeroSlideInput,
  sortOrder: number
): Promise<{ error: string } | { success: true; id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const title = input.lines.filter(Boolean).join(" ");
  if (!title) return { error: "กรุณาใส่ข้อความอย่างน้อย 1 บรรทัด" };

  const endsAt = new Date(Date.now() + input.duration_hours * 3_600_000).toISOString();

  const { data: pred, error: predErr } = await supabase
    .from("predictions")
    .insert({
      creator_id: user.id,
      title,
      category_id: input.category_id,
      ends_at: endsAt,
      yes_pool: 0,
      no_pool: 0,
      yes_label: input.yes_label,
      no_label: input.no_label,
    })
    .select("id")
    .single();

  if (predErr) return { error: "สร้าง prediction ไม่สำเร็จ: " + predErr.message };

  const { data: slide, error: slideErr } = await supabase
    .from("hero_slides")
    .insert({
      sort_order: sortOrder,
      lines: input.lines.filter(Boolean),
      category: input.category,
      yes_pct: input.yes_pct,
      yes_label: input.yes_label,
      no_label: input.no_label,
      yes_btn: input.yes_btn,
      no_btn: input.no_btn,
      duration_hours: input.duration_hours,
      viewers: input.viewers,
      heat_level: input.heat_level,
      prediction_id: pred.id,
      bg_image: input.bg_image,
      bg_position: input.bg_position,
      active: input.active,
    })
    .select("id")
    .single();

  if (slideErr) {
    await supabase.from("predictions").delete().eq("id", pred.id);
    return { error: "สร้าง hero slide ไม่สำเร็จ: " + slideErr.message };
  }

  revalidatePath("/");
  return { success: true, id: slide.id };
}

export async function reorderHeroSlides(items: { id: string; sort_order: number }[]) {
  const supabase = await createClient();
  await Promise.all(items.map(({ id, sort_order }) =>
    supabase.from("hero_slides").update({ sort_order }).eq("id", id)
  ));
  revalidatePath("/");
}
