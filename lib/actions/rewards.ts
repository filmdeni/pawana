"use server";
import { createClient } from "@/lib/supabase/server";

const DAILY_CLAIM_AMOUNT = 50;
const HOUSE_EDGE = 0.05; // 5%

export async function claimPredictionReward(predictionId: string): Promise<
  | { ok: true; reward: number; newBalance: number }
  | { ok: false; reason: "not_logged_in" | "no_vote" | "wrong_side" | "not_resolved" | "already_claimed" | "error" }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_logged_in" };

  const { data: pred } = await supabase
    .from("predictions")
    .select("title, resolution, resolution_index, yes_pool, no_pool, house_pool, options, option_pools")
    .eq("id", predictionId)
    .single();
  if (!pred || (pred.resolution === null && pred.resolution_index === null)) return { ok: false, reason: "not_resolved" };

  const { data: vote } = await supabase
    .from("votes")
    .select("choice, choice_index, amount, reward_claimed")
    .eq("prediction_id", predictionId)
    .eq("user_id", user.id)
    .single();
  if (!vote) return { ok: false, reason: "no_vote" };
  if (vote.reward_claimed) return { ok: false, reason: "already_claimed" };

  // Determine win/loss
  const isMultiOption = pred.resolution_index !== null && pred.resolution_index !== undefined;
  const won = isMultiOption
    ? vote.choice_index === pred.resolution_index
    : vote.choice === pred.resolution;
  if (!won) return { ok: false, reason: "wrong_side" };

  // Parimutuel payout
  let effTotal: number;
  let effWinPool: number;
  const hp = pred.house_pool ?? 500;

  if (isMultiOption) {
    const optionPools = (pred.option_pools as number[] | null) ?? [];
    const poolsWithHouse = optionPools.map((p: number) => p + hp / Math.max(optionPools.length, 1));
    effTotal = poolsWithHouse.reduce((s: number, v: number) => s + v, 0);
    effWinPool = poolsWithHouse[pred.resolution_index!] ?? 1;
  } else {
    const effYes = (pred.yes_pool ?? 0) + hp;
    const effNo  = (pred.no_pool  ?? 0) + hp;
    effTotal = effYes + effNo;
    effWinPool = pred.resolution ? effYes : effNo;
  }

  const payout = Math.floor(vote.amount * (effTotal / Math.max(effWinPool, 1)) * (1 - HOUSE_EDGE));
  const finalPayout = Math.max(payout, vote.amount);
  const profit = finalPayout - vote.amount;

  // Mark claimed
  const { error: updateErr } = await supabase
    .from("votes")
    .update({ reward_claimed: true, reward_amount: finalPayout })
    .eq("prediction_id", predictionId)
    .eq("user_id", user.id);
  if (updateErr) return { ok: false, reason: "error" };

  // Credit coins
  const { data: rpcData, error: rpcErr } = await supabase.rpc("add_coins_and_xp", {
    p_user_id: user.id,
    p_coins: finalPayout,
    p_xp: Math.max(10, Math.floor(profit / 10)),
  });
  if (rpcErr) return { ok: false, reason: "error" };

  const newBalance = (rpcData as { coins: number } | null)?.coins ?? 0;

  // Push notification — type "win" triggers WinNotificationLayer popup
  const xpGained = Math.max(10, Math.floor(profit / 10));
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "win",
    title: "ทายถูก! 🎉",
    body: `"${pred.title ?? "คำทำนาย"}" — คุณได้รับ ${finalPayout.toLocaleString()} ญาณฯ`,
    data: { prediction_id: predictionId, coins: finalPayout, xp: xpGained },
  });

  return { ok: true, reward: finalPayout, newBalance };
}

export async function markWelcomed(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("welcomed_at", null); // only if not already welcomed
}

export async function claimDaily(): Promise<
  | { ok: true; coins: number }
  | { ok: false; reason: "already_claimed" | "not_logged_in" }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_logged_in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, daily_claimed_at")
    .eq("id", user.id)
    .single();

  if (!profile) return { ok: false, reason: "not_logged_in" };

  // Check if already claimed today (UTC day)
  const lastClaim = profile.daily_claimed_at ? new Date(profile.daily_claimed_at) : null;
  const todayUTC = new Date().toISOString().slice(0, 10);
  if (lastClaim && lastClaim.toISOString().slice(0, 10) === todayUTC) {
    return { ok: false, reason: "already_claimed" };
  }

  // Atomic increment — no read-then-write race condition
  await supabase
    .from("profiles")
    .update({ daily_claimed_at: new Date().toISOString() })
    .eq("id", user.id);

  const { data: rpcData, error: rpcErr } = await supabase.rpc("add_coins_and_xp", {
    p_user_id: user.id,
    p_coins: DAILY_CLAIM_AMOUNT,
    p_xp: 0,
  });
  if (rpcErr) return { ok: false, reason: "not_logged_in" };

  const newCoins = (rpcData as { coins: number } | null)?.coins ?? 0;
  return { ok: true, coins: newCoins };
}

export async function acceptTerms(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("terms_accepted_at", null);
}

export async function getRewardState(): Promise<{
  isNewUser: boolean;
  canClaimDaily: boolean;
  coins: number;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, welcomed_at, daily_claimed_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const lastClaim = profile.daily_claimed_at ? new Date(profile.daily_claimed_at) : null;
  const todayUTC = new Date().toISOString().slice(0, 10);
  const canClaimDaily = !lastClaim || lastClaim.toISOString().slice(0, 10) !== todayUTC;

  return {
    isNewUser: !profile.welcomed_at,
    canClaimDaily,
    coins: profile.coins ?? 0,
  };
}
