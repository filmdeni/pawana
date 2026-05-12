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
    fields?: { title?: string; description?: string; ends_at?: string; is_featured?: boolean; is_trending?: boolean; image_url?: string | null; image_position?: string; category_id?: number | null };
  };

  let patch: Record<string, unknown> = {};
  if (action === "approve") patch = { status: "approved" };
  else if (action === "reject") patch = { status: "rejected" };
  else if (action === "resolve" && resolution !== undefined) {
    patch = { resolution, resolved_at: new Date().toISOString(), status: "approved" };

    // Update prediction first
    const { error: predError } = await supabase.from("predictions").update(patch).eq("id", id);
    if (predError) return NextResponse.json({ error: predError.message }, { status: 500 });

    // Fetch prediction info + all votes
    const { data: pred } = await supabase
      .from("predictions")
      .select("title, yes_pool, no_pool")
      .eq("id", id)
      .single();

    const { data: votes } = await supabase
      .from("votes")
      .select("id, user_id, choice, amount")
      .eq("prediction_id", id);

    if (pred && votes && votes.length > 0) {
      const winningPool = resolution ? pred.yes_pool : pred.no_pool;
      const losingPool  = resolution ? pred.no_pool  : pred.yes_pool;

      const notifications: {
        user_id: string; type: string; title: string; body: string;
        data: Record<string, unknown>;
      }[] = [];

      // Fetch all winner profiles in one query
      const voterIds = votes.map((v) => v.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, coins, xp, correct_predictions, total_predictions")
        .in("id", voterIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      for (const vote of votes) {
        const isWinner = vote.choice === resolution;
        let coinsDelta = 0;
        const xpDelta = isWinner ? 50 : 10;

        if (isWinner && winningPool > 0) {
          const share = (vote.amount / winningPool) * losingPool * 0.95;
          coinsDelta = Math.floor(vote.amount + share);
        }

        const profile = profileMap.get(vote.user_id);
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              coins: profile.coins + coinsDelta,
              xp: profile.xp + xpDelta,
              correct_predictions: profile.correct_predictions + (isWinner ? 1 : 0),
              total_predictions: profile.total_predictions + 1,
            })
            .eq("id", vote.user_id);
        }

        notifications.push({
          user_id: vote.user_id,
          type: isWinner ? "win" : "lose",
          title: isWinner ? "ทายถูก! 🎉" : "ทายผิด 😔",
          body: isWinner
            ? `"${pred.title}" — คุณได้รับ ${coinsDelta.toLocaleString()} พาราฯ`
            : `"${pred.title}" — เสียใจด้วย ไว้โชคดีครั้งหน้า`,
          data: {
            prediction_id: id,
            coins: coinsDelta,
            xp: xpDelta,
            is_winner: isWinner,
          },
        });
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ ok: true });
  } else if (action === "update" && fields) {
    const allowed = ["title", "description", "ends_at", "is_featured", "is_trending", "image_url", "image_position", "category_id"] as const;
    for (const k of allowed) if (fields[k] !== undefined) patch[k] = fields[k];
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // approve / reject / update reach here
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
