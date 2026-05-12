import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get("prediction_id");
  if (!predictionId) return NextResponse.json({ error: "prediction_id required" }, { status: 400 });

  const supabase = await createClient();

  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();

  const { data: comments, error } = await supabase
    .from("comments_enriched")
    .select("*")
    .eq("prediction_id", predictionId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch user's vote choice so we can show YES/NO badge
  let userChoice: boolean | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("choice")
      .eq("prediction_id", predictionId)
      .eq("user_id", user.id)
      .single();
    if (vote) userChoice = vote.choice;
  }

  // Fetch which comments the current user has liked
  let likedIds: string[] = [];
  if (user && comments?.length) {
    const ids = comments.map((c: { id: string }) => c.id);
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", ids);
    likedIds = (likes ?? []).map((l: { comment_id: string }) => l.comment_id);
  }

  // Attach per-comment vote badge using each author's vote
  const authorIds = [...new Set((comments ?? []).map((c: { user_id: string }) => c.user_id))];
  let authorChoices: Record<string, boolean> = {};
  if (authorIds.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("user_id, choice")
      .eq("prediction_id", predictionId)
      .in("user_id", authorIds);
    for (const v of votes ?? []) authorChoices[v.user_id] = v.choice;
  }

  const result = (comments ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    liked_by_me: likedIds.includes(c.id as string),
    author_choice: authorChoices[c.user_id as string] ?? null,
  }));

  return NextResponse.json({ comments: result, user_id: user?.id ?? null, user_choice: userChoice });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { safeGetUser } = await import("@/lib/supabase/server");
  const user = await safeGetUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { prediction_id, body: text } = body;

  if (!prediction_id || !text?.trim()) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
  }
  if (text.trim().length > 500) {
    return NextResponse.json({ error: "ความคิดเห็นยาวเกินไป" }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({ prediction_id, user_id: user.id, body: text.trim() })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return enriched row
  const { data: enriched } = await supabase
    .from("comments_enriched")
    .select("*")
    .eq("id", inserted.id)
    .single();

  // Get author's vote
  const { data: vote } = await supabase
    .from("votes")
    .select("choice")
    .eq("prediction_id", prediction_id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    comment: { ...enriched, liked_by_me: false, author_choice: vote?.choice ?? null },
  }, { status: 201 });
}
