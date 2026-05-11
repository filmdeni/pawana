"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type VoteResult = { error: string } | { success: true; newYesPool: number; newNoPool: number };

export async function castVoteAction(
  predictionId: string,
  choice: boolean,
  amount: number
): Promise<VoteResult> {
  if (amount < 10) return { error: "จำนวนขั้นต่ำคือ 10 พาราฯ" };
  if (amount > 100000) return { error: "จำนวนสูงสุดคือ 100,000 พาราฯ" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  // Check balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < amount) return { error: "พาราฯ ไม่เพียงพอ" };

  // Check existing vote
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("prediction_id", predictionId)
    .eq("user_id", user.id)
    .single();

  if (existing) return { error: "คุณได้ทำนายหัวข้อนี้แล้ว" };

  // Insert vote (trigger will update pools + deduct coins)
  const { error } = await supabase.from("votes").insert({
    prediction_id: predictionId,
    user_id: user.id,
    choice,
    amount,
  });

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  // Fetch updated pools + prediction title
  const { data: pred } = await supabase
    .from("predictions")
    .select("yes_pool, no_pool, title")
    .eq("id", predictionId)
    .single();

  // Save notification to DB
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "vote",
    title: "ทำนายสำเร็จ 🔮",
    body: `คุณวางเดิมพัน ${amount.toLocaleString()} พาราฯ ใน "${pred?.title ?? "คำทำนาย"}" — ${choice ? "ใช่" : "ไม่ใช่"}`,
    data: { prediction_id: predictionId, choice, amount },
  });

  revalidatePath(`/predict/${predictionId}`);
  return { success: true, newYesPool: pred?.yes_pool ?? 0, newNoPool: pred?.no_pool ?? 0 };
}

export async function createPredictionAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;
  const endsAt = formData.get("ends_at") as string;
  const reward = Number(formData.get("reward") ?? 0);
  const imageFile = formData.get("image") as File | null;

  if (!title || title.length < 10) return { error: "หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร" };
  if (!endsAt) return { error: "กรุณาเลือกวันสิ้นสุด" };

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("predictions")
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (uploadError) return { error: "อัปโหลดรูปภาพไม่สำเร็จ: " + uploadError.message };
    const { data: publicData } = supabase.storage.from("predictions").getPublicUrl(path);
    imageUrl = publicData.publicUrl;
  }

  const { data, error } = await supabase.from("predictions").insert({
    creator_id: user.id,
    title,
    description,
    category_id: categoryId,
    ends_at: endsAt,
    yes_pool: reward,
    no_pool: 0,
    image_url: imageUrl,
  }).select("id").single();

  if (error) return { error: "เกิดข้อผิดพลาด: " + error.message };

  revalidatePath("/predict");
  revalidatePath("/");
  return { success: true, id: data.id };
}
