import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 50);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const offset = (page - 1) * limit;
  const sort = searchParams.get("sort") ?? "trending";

  const supabase = await createClient();

  let query = supabase
    .from("predictions")
    .select(
      `id, title, description, yes_pool, no_pool, participant_count,
       ends_at, is_trending, is_featured,
       categories ( slug, label, emoji ),
       profiles ( username, display_name )`,
      { count: "exact" }
    )
    .gt("ends_at", new Date().toISOString())
    .eq("status", "approved")
    .is("resolution", null)
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("categories.slug", category);
  }

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "ending") query = query.order("ends_at", { ascending: true });
  else query = query.order("participant_count", { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data, count, page, limit, pages: Math.ceil((count ?? 0) / limit) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, category_id, ends_at, reward } = body;

  if (!title || title.length < 10) {
    return NextResponse.json({ error: "หัวข้อต้องมีอย่างน้อย 10 ตัวอักษร" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("predictions")
    .insert({
      creator_id: user.id,
      title,
      description: description ?? null,
      category_id: category_id ?? null,
      ends_at,
      yes_pool: Number(reward) || 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
