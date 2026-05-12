import { getLeaderboard } from "@/lib/queries/predictions";
import { getSessionUser } from "@/lib/actions/auth";
import RankingClient from "./RankingClient";
import ParallaxBg from "@/components/ParallaxBg";

export default async function RankingPage() {
  const [dbLeaders, user] = await Promise.all([
    getLeaderboard(20).catch(() => []),
    getSessionUser().catch(() => null),
  ]);

  return (
    <div className="relative">
      <ParallaxBg variant="orange" />
      <div className="relative" style={{ zIndex: 1 }}>
        <RankingClient dbLeaders={dbLeaders} currentUserId={user?.id ?? null} />
      </div>
    </div>
  );
}
