import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already liked
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("comment_likes").delete()
      .eq("comment_id", commentId).eq("user_id", user.id);
    return NextResponse.json({ liked: false });
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    return NextResponse.json({ liked: true });
  }
}
