"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Reward config per slug
const MISSION_REWARDS: Record<string, { coins: number; xp: number }> = {
  daily_login:    { coins: 50,   xp: 20  },
  daily_predict:  { coins: 150,  xp: 60  },
  daily_comment:  { coins: 100,  xp: 40  },
  weekly_win5:    { coins: 500,  xp: 200 },
  weekly_invite:  { coins: 1000, xp: 400 },
  weekly_predict10: { coins: 300, xp: 120 },
  special_100win: { coins: 5000, xp: 2000 },
  special_streak30: { coins: 3000, xp: 1000 },
  special_spend10k: { coins: 2000, xp: 800 },
};

function getMissionPeriodKey(resetAt: string | null): string {
  const now = new Date();
  if (resetAt === "daily") return now.toISOString().slice(0, 10);
  if (resetAt === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date(now).setDate(diff));
    const y = monday.getFullYear();
    const w = Math.ceil(((monday.getTime() - new Date(y, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${y}-W${String(w).padStart(2, "0")}`;
  }
  return "lifetime";
}

const MISSION_RESET: Record<string, string | null> = {
  daily_login:      "daily",
  daily_predict:    "daily",
  daily_comment:    "daily",
  weekly_win5:      "weekly",
  weekly_invite:    "weekly",
  weekly_predict10: "weekly",
  special_100win:   null,
  special_streak30: null,
  special_spend10k: null,
};

export async function claimMissionAction(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const reward = MISSION_REWARDS[slug];
  if (!reward) return { error: "ไม่พบภารกิจ" };

  const periodKey = getMissionPeriodKey(MISSION_RESET[slug] ?? null);

  // Get mission id
  const { data: mission } = await supabase
    .from("missions")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!mission) return { error: "ไม่พบภารกิจ" };

  // Check if already claimed this period
  const { data: existing } = await supabase
    .from("user_missions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_id", mission.id)
    .eq("period_key", periodKey)
    .eq("completed", true)
    .single();

  if (existing) return { error: "รับแล้วในรอบนี้" };

  // Mark as claimed
  const { error: upsertErr } = await supabase.from("user_missions").upsert({
    user_id: user.id,
    mission_id: mission.id,
    period_key: periodKey,
    progress: 1,
    completed: true,
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,mission_id,period_key" });
  if (upsertErr) return { error: "บันทึกภารกิจล้มเหลว: " + upsertErr.message };

  // Give coins + xp (atomic — no read-then-write race condition)
  const { error: rpcErr } = await supabase.rpc("add_coins_and_xp", {
    p_user_id: user.id,
    p_coins: reward.coins,
    p_xp: reward.xp,
  });
  if (rpcErr) return { error: "อัปเดตโปรไฟล์ล้มเหลว: " + rpcErr.message };

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "mission",
    title: "ภารกิจสำเร็จ! ⚡",
    body: `รับรางวัล +${reward.coins.toLocaleString()} ญาณฯ และ +${reward.xp} XP`,
    data: { slug, coins: reward.coins, xp: reward.xp },
  });

  revalidatePath("/missions");
  revalidatePath("/");
  return { success: true };
}

export async function getClaimedMissionSlugs(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date(now).setDate(diff));
  const y = monday.getFullYear();
  const w = Math.ceil(((monday.getTime() - new Date(y, 0, 1).getTime()) / 86400000 + 1) / 7);
  const weekKey = `${y}-W${String(w).padStart(2, "0")}`;

  const { data } = await supabase
    .from("user_missions")
    .select("period_key, missions(slug)")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("period_key", [todayKey, weekKey, "lifetime"]);

  return (data ?? []).map((r: any) => r.missions?.slug).filter(Boolean);
}
