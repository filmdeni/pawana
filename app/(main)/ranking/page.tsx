import { getLeaderboard } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import RankingClient from "./RankingClient";

export default async function RankingPage() {
  const [dbLeaders, user] = await Promise.all([
    getLeaderboard(20).catch(() => []),
    getSessionUser().catch(() => null),
  ]);

  return <RankingClient dbLeaders={dbLeaders} currentUserId={user?.id ?? null} />;
}
