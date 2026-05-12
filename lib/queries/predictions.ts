import { createClient } from "@/lib/supabase/server";

export interface PredictionRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_position: string | null;
  yes_pool: number;
  no_pool: number;
  participant_count: number;
  ends_at: string;
  is_trending: boolean;
  is_featured: boolean;
  yes_label: string;
  no_label: string;
  categories: { slug: string; label: string; emoji: string | null } | null;
  profiles: { username: string; display_name: string | null } | null;
}

export async function getTrendingPredictions(limit = 8): Promise<PredictionRow[]> {
  const supabase = await createClient();

  // Try manually curated hot picks first
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
        id, title, description, image_url, image_position, yes_pool, no_pool, participant_count,
        ends_at, is_trending, is_featured, yes_label, no_label,
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

  // Fallback: most popular active predictions
  const { data, error } = await supabase
    .from("predictions")
    .select(`
      id, title, description, image_url, image_position, yes_pool, no_pool, participant_count,
      ends_at, is_trending, is_featured,
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
      id, title, description, image_url, image_position, yes_pool, no_pool, participant_count,
      ends_at, is_trending, is_featured,
      categories ( slug, label, emoji ),
      profiles ( username, display_name )
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as PredictionRow;
}

export async function getUserVote(
  predictionId: string,
  userId: string
): Promise<{ choice: boolean; amount: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("choice, amount")
    .eq("prediction_id", predictionId)
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function getLeaderboard(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(limit);
  return data ?? [];
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

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
