"use server";
import { createClient } from "@/lib/supabase/server";

export interface BtcRound {
  id: string;
  starts_at: string;
  ends_at: string;
  start_price: number | null;
  end_price: number | null;
  result: "up" | "down" | null;
  up_pool: number;
  down_pool: number;
}

export interface BtcBet {
  id: string;
  round_id: string;
  direction: "up" | "down";
  amount: number;
  payout: number | null;
  won: boolean | null;
}

// Get-or-create the round for the current 5-minute window
export async function getCurrentRound(
  startsAt: string,
  endsAt: string,
  startPrice: number
): Promise<BtcRound | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_btc_round", {
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_start_price: startPrice,
  });
  if (error) {
    console.error("[getCurrentRound]", error.message);
    return null;
  }
  return data as BtcRound;
}

// Place a bet — returns error string or null on success
export async function placeBtcBet(
  roundId: string,
  direction: "up" | "down",
  amount: number
): Promise<{ bet: BtcBet | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bet: null, error: "กรุณาเข้าสู่ระบบก่อน" };

  const { data, error } = await supabase.rpc("place_btc_bet", {
    p_round_id: roundId,
    p_direction: direction,
    p_amount: amount,
  });

  if (error) {
    const msg: Record<string, string> = {
      not_authenticated:  "กรุณาเข้าสู่ระบบก่อน",
      round_not_found:    "ไม่พบรอบการทาย",
      round_closed:       "รอบนี้เฉลยแล้ว",
      round_locked:       "ปิดรับการทายแล้ว (เหลือน้อยกว่า 30 วิ)",
      insufficient_coins: "ญาณ ไม่พอ",
    };
    const key = Object.keys(msg).find(k => error.message.includes(k));
    return { bet: null, error: key ? msg[key] : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" };
  }

  return { bet: data as BtcBet, error: null };
}

// Get user's bet for a specific round
export async function getMyBet(roundId: string): Promise<BtcBet | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("btc_bets")
    .select("*")
    .eq("round_id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data as BtcBet | null;
}

// Get user's coin balance
export async function getMyCoinBalance(): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();
  return data?.coins ?? null;
}

// Get last N resolved rounds for history
export async function getRecentRounds(limit = 10): Promise<BtcRound[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("btc_rounds")
    .select("*")
    .not("result", "is", null)
    .order("ends_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as BtcRound[];
}
