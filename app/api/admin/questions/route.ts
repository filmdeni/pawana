import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return data?.is_admin ? user : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await assertAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    title: string;
    description?: string;
    ends_at: string;
    category_id: number;
    is_featured: boolean;
    is_trending: boolean;
    image_url?: string | null;
    image_position?: string;
    yes_label?: string;
    no_label?: string;
  };

  if (!body.title || body.title.length < 10)
    return NextResponse.json({ error: "หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร" }, { status: 400 });

  const { data, error } = await supabase
    .from("predictions")
    .insert({
      creator_id: user.id,
      title: body.title,
      description: body.description ?? null,
      ends_at: body.ends_at,
      category_id: body.category_id,
      is_featured: body.is_featured,
      is_trending: body.is_trending,
      image_url: body.image_url ?? null,
      image_position: body.image_position ?? "50% 50%",
      yes_label: body.yes_label ?? "ใช่",
      no_label: body.no_label ?? "ไม่ใช่",
      status: "approved",
      yes_pool: 0,
      no_pool: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
