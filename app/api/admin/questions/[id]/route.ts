import { NextRequest, NextResponse } from "next/server";
import { createClient, safeGetUser } from "@/lib/supabase/server";

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const user = await safeGetUser(supabase);
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
  const { action, resolution, resolution_index, fields } = body as {
    action: string;
    resolution?: boolean;
    resolution_index?: number;
    fields?: { title?: string; description?: string; ends_at?: string; is_featured?: boolean; is_trending?: boolean; show_chart?: boolean; image_url?: string | null; image_position?: string; category_id?: number | null; subcategory?: string | null; yes_label?: string; no_label?: string };
  };

  let patch: Record<string, unknown> = {};
  if (action === "approve") patch = { status: "approved" };
  else if (action === "reject") patch = { status: "rejected" };
  else if (action === "resolve" && (resolution !== undefined || resolution_index !== undefined)) {
    const isMultiOption = resolution_index !== undefined;
    patch = {
      resolved_at: new Date().toISOString(),
      status: "approved",
      ...(isMultiOption
        ? { resolution_index, resolution: true }
        : { resolution }),
    };

    // Update prediction first
    const { error: predError } = await supabase.from("predictions").update(patch).eq("id", id);
    if (predError) return NextResponse.json({ error: predError.message }, { status: 500 });

    // Fetch prediction info + all unclaimed votes
    const { data: pred, error: predFetchErr } = await supabase
      .from("predictions")
      .select("title, yes_pool, no_pool, house_pool, options, option_pools")
      .eq("id", id)
      .single();

    if (predFetchErr || !pred) {
      console.error("[resolve] pred fetch failed:", predFetchErr?.message);
      return NextResponse.json({ error: "prediction fetch failed: " + predFetchErr?.message }, { status: 500 });
    }

    const { data: votes, error: votesFetchErr } = await supabase
      .from("votes")
      .select("id, user_id, choice, choice_index, amount, reward_claimed")
      .eq("prediction_id", id)
      .eq("reward_claimed", false);

    if (votesFetchErr) {
      console.error("[resolve] votes fetch failed:", votesFetchErr.message);
      return NextResponse.json({ error: "votes fetch failed" }, { status: 500 });
    }

    if (votes && votes.length > 0) {
      // Determine total pool and winning pool for payout calculation
      let effTotal: number;
      let effWinPool: number;

      if (isMultiOption) {
        const optionPools = (pred.option_pools as number[] | null) ?? [];
        const hp = pred.house_pool ?? 500;
        const poolsWithHouse = optionPools.map((p: number) => p + hp / optionPools.length);
        effTotal = poolsWithHouse.reduce((s: number, v: number) => s + v, 0);
        effWinPool = poolsWithHouse[resolution_index!] ?? 1;
      } else {
        const hp = pred.house_pool ?? 500;
        const effYes = (pred.yes_pool ?? 0) + hp;
        const effNo  = (pred.no_pool  ?? 0) + hp;
        effTotal   = effYes + effNo;
        effWinPool = resolution ? effYes : effNo;
      }

      const notifications: {
        user_id: string; type: string; title: string; body: string;
        data: Record<string, unknown>;
      }[] = [];

      const voterIds = votes.map((v) => v.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, coins, xp, correct_predictions, total_predictions")
        .in("id", voterIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      for (const vote of votes) {
        const isWinner = isMultiOption
          ? vote.choice_index === resolution_index
          : vote.choice === resolution;
        let coinsDelta = 0;
        const xpDelta = isWinner ? 50 : 10;

        if (isWinner) {
          const payout = Math.floor(vote.amount * (effTotal / Math.max(effWinPool, 1)) * 0.95);
          coinsDelta = Math.max(payout, vote.amount);
        }

        await supabase
          .from("votes")
          .update({ reward_claimed: true, reward_amount: coinsDelta })
          .eq("id", vote.id);

        const profile = profileMap.get(vote.user_id);
        if (profile) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({
              coins: profile.coins + coinsDelta,
              xp: profile.xp + xpDelta,
              correct_predictions: profile.correct_predictions + (isWinner ? 1 : 0),
              total_predictions: profile.total_predictions + 1,
            })
            .eq("id", vote.user_id);
          if (updateErr) console.error("[resolve] profile update failed:", vote.user_id, updateErr.message);
        }

        notifications.push({
          user_id: vote.user_id,
          type: isWinner ? "win" : "lose",
          title: isWinner ? "ทายถูก! 🎉" : "ทายผิด 😔",
          body: isWinner
            ? `"${pred.title}" — คุณได้รับ ${coinsDelta.toLocaleString()} ญาณฯ`
            : `"${pred.title}" — เสียใจด้วย ไว้โชคดีครั้งหน้า`,
          data: { prediction_id: id, coins: coinsDelta, xp: xpDelta, is_winner: isWinner },
        });
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ ok: true });
  } else if (action === "update" && fields) {
    const allowed = ["title", "description", "ends_at", "is_featured", "is_trending", "show_chart", "image_url", "image_position", "category_id", "subcategory", "yes_label", "no_label"] as const;
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
