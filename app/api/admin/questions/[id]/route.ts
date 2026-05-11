import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return !!data?.is_admin;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await assertAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, resolution, fields } = body as {
    action: string;
    resolution?: boolean;
    fields?: { title?: string; description?: string; ends_at?: string; is_featured?: boolean; is_trending?: boolean; image_url?: string | null; category_id?: number | null };
  };

  let patch: Record<string, unknown> = {};
  if (action === "approve") patch = { status: "approved" };
  else if (action === "reject") patch = { status: "rejected" };
  else if (action === "resolve" && resolution !== undefined) {
    patch = { resolution, resolved_at: new Date().toISOString(), status: "approved" };
  } else if (action === "update" && fields) {
    const allowed = ["title", "description", "ends_at", "is_featured", "is_trending", "image_url", "category_id"] as const;
    for (const k of allowed) if (fields[k] !== undefined) patch[k] = fields[k];
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabase.from("predictions").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await assertAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("predictions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
