"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type VoteResult = { error: string } | { success: true; newYesPool: number; newNoPool: number; newOptionPools?: number[] };

export async function castVoteAction(
  predictionId: string,
  choiceOrIndex: boolean | number,
  amount: number
): Promise<VoteResult> {
  if (amount < 10) return { error: "จำนวนขั้นต่ำคือ 10 ญาณฯ" };
  if (amount > 100000) return { error: "จำนวนสูงสุดคือ 100,000 ญาณฯ" };

  const isMulti = typeof choiceOrIndex === "number";
  const choice = isMulti ? (choiceOrIndex === 0) : (choiceOrIndex as boolean);
  const choiceIndex = isMulti ? (choiceOrIndex as number) : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < amount) return { error: "ญาณฯ ไม่เพียงพอ" };

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("prediction_id", predictionId)
    .eq("user_id", user.id)
    .single();

  if (existing) return { error: "คุณได้ทำนายหัวข้อนี้แล้ว" };

  const votePayload: Record<string, unknown> = {
    prediction_id: predictionId,
    user_id: user.id,
    choice,
    amount,
  };
  if (choiceIndex !== null) votePayload.choice_index = choiceIndex;

  const { error } = await supabase.from("votes").insert(votePayload);
  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  // For multi-option: update option_pools manually
  let newOptionPools: number[] | undefined;
  if (isMulti) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("option_pools")
      .eq("id", predictionId)
      .single();
    const pools: number[] = (pred?.option_pools as number[]) ?? [];
    pools[choiceIndex as number] = (pools[choiceIndex as number] ?? 0) + amount;
    await supabase.from("predictions").update({ option_pools: pools }).eq("id", predictionId);
    newOptionPools = pools;
  }

  const { data: updated } = await supabase
    .from("predictions")
    .select("yes_pool, no_pool, title, options")
    .eq("id", predictionId)
    .single();

  const options = updated?.options as string[] | null;
  const choiceLabel = isMulti
    ? (options?.[choiceIndex as number] ?? `ตัวเลือก ${(choiceIndex as number) + 1}`)
    : (choice ? "ใช่" : "ไม่ใช่");

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "vote",
    title: "ทำนายสำเร็จ 🔮",
    body: `คุณวางเดิมพัน ${amount.toLocaleString()} ญาณฯ ใน "${updated?.title ?? "คำทำนาย"}" — ${choiceLabel}`,
    data: { prediction_id: predictionId, choice, choice_index: choiceIndex, amount },
  });

  revalidatePath(`/predict/${predictionId}`);
  return {
    success: true,
    newYesPool: updated?.yes_pool ?? 0,
    newNoPool: updated?.no_pool ?? 0,
    newOptionPools,
  };
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
  const imagePosition = (formData.get("image_position") as string | null) ?? "50% 50%";
  const subcategory = (formData.get("subcategory") as string | null) || null;
  const optionsRaw = formData.get("options") as string | null;
  const options: string[] = optionsRaw ? JSON.parse(optionsRaw) : ["ใช่", "ไม่ใช่"];
  const yesLabel = options[0] ?? "ใช่";
  const noLabel = options[1] ?? "ไม่ใช่";
  const isMultiOption = options.length > 2;
  const optionPools = isMultiOption ? options.map((_, i) => i === 0 ? reward : 0) : null;

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

  const insertPayload: Record<string, unknown> = {
    creator_id: user.id,
    title,
    description,
    category_id: categoryId,
    subcategory,
    ends_at: endsAt,
    yes_pool: reward,
    no_pool: 0,
    image_url: imageUrl,
    image_position: imagePosition,
    yes_label: yesLabel,
    no_label: noLabel,
  };
  if (isMultiOption) {
    insertPayload.options = options;
    insertPayload.option_pools = optionPools;
  }

  const { data, error } = await supabase.from("predictions").insert(insertPayload).select("id").single();

  if (error) return { error: "เกิดข้อผิดพลาด: " + error.message };

  revalidatePath("/predict");
  revalidatePath("/");
  return { success: true, id: data.id };
}
