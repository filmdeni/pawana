export type Tier = "bronze" | "silver" | "gold" | "diamond" | "legend";
export type PredictionResolution = boolean | null;
export type VoteChoice = boolean;
export type NotifType = "win" | "lose" | "rank" | "mission" | "comment" | "system";
export type ItemType = "boost" | "frame" | "badge" | "effect" | "box";
export type Rarity = "uncommon" | "rare" | "epic" | "legendary";
export type MissionType = "daily" | "weekly" | "special";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  title: string;
  tier: Tier;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  last_login: string | null;
  rank_position: number | null;
  total_predictions: number;
  correct_predictions: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  creator_id: string;
  category_id: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
  ends_at: string;
  resolved_at: string | null;
  resolution: PredictionResolution;
  yes_pool: number;
  no_pool: number;
  participant_count: number;
  view_count: number;
  is_featured: boolean;
  is_trending: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  prediction_id: string;
  user_id: string;
  choice: VoteChoice;
  amount: number;
  potential_win: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  prediction_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  likes: number;
  created_at: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  type: ItemType;
  rarity: Rarity;
  price: number;
  emoji: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}
