import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/resolutions/[id] — status + user's existing report
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reports } = await supabase
    .from("resolution_reports")
    .select("outcome")
    .eq("prediction_id", id);

  const total = reports?.length ?? 0;
  const yesCount = reports?.filter((r) => r.outcome === true).length ?? 0;
  const noCount = total - yesCount;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : null;

  let userReport: boolean | null = null;
  if (user) {
    const { data } = await supabase
      .from("resolution_reports")
      .select("outcome")
      .eq("prediction_id", id)
      .eq("user_id", user.id)
      .single();
    if (data) userReport = data.outcome;
  }

  return NextResponse.json({
    total,
    yes_count: yesCount,
    no_count: noCount,
    yes_pct: yesPct,
    user_report: userReport,
  });
}

// POST /api/resolutions/[id] — submit a report
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { outcome } = await req.json();
  if (typeof outcome !== "boolean") {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  // Check prediction has ended
  const { data: pred } = await supabase
    .from("predictions")
    .select("ends_at, resolution")
    .eq("id", id)
    .single();

  if (!pred) {
    return NextResponse.json({ error: "ไม่พบคำพยากรณ์นี้" }, { status: 404 });
  }
  if (new Date(pred.ends_at) > new Date()) {
    return NextResponse.json({ error: "คำพยากรณ์ยังไม่หมดเวลา" }, { status: 400 });
  }
  if (pred.resolution !== null) {
    return NextResponse.json({ error: "คำพยากรณ์นี้ปิดผลแล้ว" }, { status: 400 });
  }

  // Upsert report (allow changing vote within window)
  const { error } = await supabase
    .from("resolution_reports")
    .upsert({ prediction_id: id, user_id: user.id, outcome }, { onConflict: "prediction_id,user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Try to resolve via DB function
  await supabase.rpc("try_resolve_prediction", { p_id: id });

  // Return updated status
  const { data: reports } = await supabase
    .from("resolution_reports")
    .select("outcome")
    .eq("prediction_id", id);

  const total = reports?.length ?? 0;
  const yesCount = reports?.filter((r) => r.outcome === true).length ?? 0;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : null;

  return NextResponse.json({
    success: true,
    total,
    yes_count: yesCount,
    no_count: total - yesCount,
    yes_pct: yesPct,
  }, { status: 201 });
}
