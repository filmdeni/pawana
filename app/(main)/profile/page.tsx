import { getSessionUser } from "@/lib/actions/auth";
import { getUserProfile, getUserVoteHistory } from "@/lib/queries/predictions";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser().catch(() => null);
  const [profile, voteHistory] = await Promise.all([
    user ? getUserProfile(user.id).catch(() => null) : Promise.resolve(null),
    user ? getUserVoteHistory(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  const avatarUrl =
    profile?.avatar_url ??
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    null;

  return (
    <ProfileClient
      isOwner={!!user}
      username={profile?.username ?? profile?.display_name ?? "MysticPredictor"}
      displayName={profile?.display_name ?? profile?.username ?? "MysticPredictor"}
      title={profile?.title ?? "จักรวาลแห่งผู้มองเห็น"}
      avatarUrl={avatarUrl}
      coins={profile?.coins ?? 12450}
      xp={profile?.xp ?? 2450}
      level={profile?.level ?? 24}
      rankPosition={profile?.rank_position ?? 24}
      totalPredictions={profile?.total_predictions ?? 1248}
      correctPredictions={profile?.correct_predictions ?? 842}
      tier={profile?.tier ?? "gold"}
      streak={profile?.streak ?? 0}
      voteHistory={voteHistory}
    />
  );
}
