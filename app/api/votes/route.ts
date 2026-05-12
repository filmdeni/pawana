import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { prediction_id, choice, amount } = body;

  if (!prediction_id || typeof choice !== "boolean") {
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
  }

  const amt = Number(amount);
  if (!amt || amt < 10 || amt > 100000) {
    return NextResponse.json({ error: "จำนวนต้องอยู่ระหว่าง 10–100,000 พาราฯ" }, { status: 400 });
  }

  // Check balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < amt) {
    return NextResponse.json({ error: "พาราฯ ไม่เพียงพอ" }, { status: 400 });
  }

  // Check duplicate vote
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("prediction_id", prediction_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "คุณได้ทำนายหัวข้อนี้แล้ว" }, { status: 409 });
  }

  // Insert (trigger updates pools + deducts coins)
  const { error } = await supabase.from("votes").insert({
    prediction_id,
    user_id: user.id,
    choice,
    amount: amt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated pools
  const { data: pred } = await supabase
    .from("predictions")
    .select("yes_pool, no_pool, participant_count")
    .eq("id", prediction_id)
    .single();

  return NextResponse.json({ success: true, ...pred }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get("prediction_id");

  if (!predictionId) {
    return NextResponse.json({ error: "prediction_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();

  if (!user) {
    return NextResponse.json({ voted: false, vote: null });
  }

  const { data } = await supabase
    .from("votes")
    .select("choice, amount, created_at")
    .eq("prediction_id", predictionId)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ voted: !!data, vote: data ?? null });
}
