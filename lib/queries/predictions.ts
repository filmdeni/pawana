import { createClient } from "@/lib/supabase/server";

export interface PredictionRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_position: string | null;
  yes_pool: number;
  no_pool: number;
  house_pool: number;
  max_bet: number;
  participant_count: number;
  ends_at: string;
  is_trending: boolean;
  is_featured: boolean;
  yes_label: string;
  no_label: string;
  options: string[] | null;
  option_pools: number[] | null;
  show_chart: boolean;
  subcategory: string | null;
  resolution: boolean | null;
  resolution_index: number | null;
  resolved_at: string | null;
  categories: { slug: string; label: string; emoji: string | null } | null;
  profiles: { username: string; display_name: string | null } | null;
}

export async function getTrendingPredictions(limit = 8, useHotPicks = true): Promise<PredictionRow[]> {
  const supabase = await createClient();

  // Try manually curated hot picks first (homepage only)
  if (useHotPicks) {
  const { data: picks } = await supabase
    .from("hot_picks")
    .select("slot, prediction_id")
    .not("prediction_id", "is", null)
    .order("slot");

  if (picks && picks.length === 4) {
    const ids = picks.map((p: { prediction_id: string }) => p.prediction_id);
    const { data, error } = await supabase
      .from("predictions")
      .select(`
        id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
        ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools, show_chart, subcategory,
        categories ( slug, label, emoji ),
        profiles ( username, display_name )
      `)
      .in("id", ids);
    if (!error && data) {
      // Preserve slot order
      const map = new Map(data.map((r: any) => [r.id, r]));
      const ordered = ids.map((id) => map.get(id)).filter(Boolean);
      return ordered as unknown as PredictionRow[];
    }
  }
  } // end useHotPicks

  // Fallback: most popular active predictions
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .gt("ends_at", new Date().toISOString())
    .is("resolution", null)
    .order("participant_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTrendingPredictions:", error.message);
    return [];
  }
  return (data ?? []) as unknown as PredictionRow[];
}

export async function getPredictionById(id: string): Promise<PredictionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, max_bet, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools,
      resolution, resolution_index, resolved_at,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as PredictionRow;
}

export async function getRelatedPredictions(
  excludeId: string,
  categorySlug: string | null,
  limit = 3
): Promise<{ id: string; title: string; ends_at: string; categories: { label: string; emoji: string | null } | null }[]> {
  const supabase = await createClient();
  let query = supabase
    .from("predictions")
    .select("id, title, ends_at, categories ( label, emoji )")
    .neq("id", excludeId)
    .is("resolution", null)
    .gt("ends_at", new Date().toISOString())
    .order("participant_count", { ascending: false })
    .limit(limit);

  if (categorySlug) {
    // prefer same category, fall back handled by caller
    query = query.eq("category_id", categorySlug);
  }

  const { data } = await query;
  if (!data || data.length === 0) {
    // fallback: any category
    const { data: fallback } = await supabase
      .from("predictions")
      .select("id, title, ends_at, categories ( label, emoji )")
      .neq("id", excludeId)
      .is("resolution", null)
      .gt("ends_at", new Date().toISOString())
      .order("participant_count", { ascending: false })
      .limit(limit);
    return (fallback ?? []) as unknown as { id: string; title: string; ends_at: string; categories: { label: string; emoji: string | null } | null }[];
  }
  return data as unknown as { id: string; title: string; ends_at: string; categories: { label: string; emoji: string | null } | null }[];
}

export async function getUserVote(
  predictionId: string,
  userId: string
): Promise<{ choice: boolean; choice_index: number | null; amount: number; reward_claimed: boolean; reward_amount: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("choice, choice_index, amount, reward_claimed, reward_amount")
    .eq("prediction_id", predictionId)
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function getUserVotesMap(
  predictionIds: string[],
  userId: string
): Promise<Record<string, { choice: boolean; choice_index: number | null; amount: number }>> {
  if (!predictionIds.length) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("prediction_id, choice, choice_index, amount")
    .in("prediction_id", predictionIds)
    .eq("user_id", userId);
  const map: Record<string, { choice: boolean; choice_index: number | null; amount: number }> = {};
  for (const row of data ?? []) {
    map[row.prediction_id] = { choice: row.choice, choice_index: row.choice_index, amount: row.amount };
  }
  return map;
}

export async function getLeaderboard(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(limit);
  return data ?? [];
}

export async function getUserWorldRank(userId: string): Promise<{ rank: number; coins: number; accuracy_pct: number } | null> {
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("leaderboard")
    .select("coins, accuracy_pct")
    .eq("id", userId)
    .single();
  if (!me) return null;
  const { count } = await supabase
    .from("leaderboard")
    .select("id", { count: "exact", head: true })
    .gt("coins", me.coins);
  return { rank: (count ?? 0) + 1, coins: me.coins, accuracy_pct: me.accuracy_pct };
}

export interface VoteHistoryRow {
  id: string;
  choice: boolean;
  amount: number;
  created_at: string;
  predictions: {
    id: string;
    title: string;
    resolution: boolean | null;
    ends_at: string;
    yes_pool: number;
    no_pool: number;
  } | null;
}

export async function getUserVoteHistory(userId: string, limit = 20): Promise<VoteHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("votes")
    .select(`
      id, choice, amount, created_at,
      predictions ( id, title, resolution, ends_at, yes_pool, no_pool )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getUserVoteHistory:", error.message);
    return [];
  }
  return (data ?? []) as unknown as VoteHistoryRow[];
}

export async function getQuickPredictions(limit = 4): Promise<PredictionRow[]> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() + 60 * 60_000).toISOString(); // ≤ 1 ชม.
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools, show_chart, subcategory,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .gt("ends_at", new Date().toISOString())
    .lte("ends_at", cutoff)
    .is("resolution", null)
    .order("ends_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as PredictionRow[];
}

export async function getEndingSoonPredictions(limit = 4): Promise<PredictionRow[]> {
  const supabase = await createClient();
  // >1h (exclude Quick) and <24h
  const after  = new Date(Date.now() + 60 * 60_000).toISOString();
  const before = new Date(Date.now() + 24 * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools, show_chart, subcategory,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .gt("ends_at", after)
    .lte("ends_at", before)
    .is("resolution", null)
    .order("ends_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as PredictionRow[];
}

export async function getForYouPredictions(limit = 4): Promise<PredictionRow[]> {
  const supabase = await createClient();
  // Featured picks first, then trending, then by pool size
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools, show_chart, subcategory,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .gt("ends_at", new Date().toISOString())
    .is("resolution", null)
    .or("is_featured.eq.true,is_trending.eq.true")
    .order("is_featured", { ascending: false })
    .order("yes_pool", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as PredictionRow[];
}

export async function getAwaitingResolutionPredictions(limit = 20): Promise<PredictionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, house_pool, participant_count,
      ends_at, is_trending, is_featured, yes_label, no_label, options, option_pools, show_chart, subcategory,
      resolution, resolved_at,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .lte("ends_at", new Date().toISOString())
    .is("resolution", null)
    .order("ends_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as PredictionRow[];
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
