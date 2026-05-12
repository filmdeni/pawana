import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "ข้อความไม่ควรว่าง" }, { status: 400 });
  if (body.trim().length > 500) return NextResponse.json({ error: "ยาวเกินไป" }, { status: 400 });

  const { error } = await supabase
    .from("comments")
    .update({ body: body.trim() })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
