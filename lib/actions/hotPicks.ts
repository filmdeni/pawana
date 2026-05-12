"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveHotPicks(slots: (string | null)[]) {
  const supabase = await createClient();
  const updates = slots.map((prediction_id, i) => ({
    slot: i + 1,
    prediction_id: prediction_id ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("hot_picks")
    .upsert(updates, { onConflict: "slot" });

  if (error) {
    console.error("saveHotPicks:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/");
}

export async function getHotPicks(): Promise<(string | null)[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hot_picks")
      .select("slot, prediction_id")
      .order("slot");
    if (error) return [null, null, null, null];
    const result: (string | null)[] = [null, null, null, null];
    for (const row of data ?? []) {
      result[row.slot - 1] = row.prediction_id ?? null;
    }
    return result;
  } catch {
    return [null, null, null, null];
  }
}
