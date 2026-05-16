import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import MobileNav from "@/components/MobileNav";
import CoinFlyLayer from "@/components/CoinFly";
import RewardClaimFX from "@/components/RewardClaimFX";
import WinNotificationLayer from "@/components/WinNotificationLayer";
import TermsConsentGate from "@/components/TermsConsentGate";
import { getSessionUser } from "@/lib/actions/auth";
import { getUserProfile } from "@/lib/queries/predictions";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");
  const profile = await getUserProfile(user.id).catch(() => null);

  const coins = profile?.coins ?? 0;
  const username = profile?.username ?? profile?.display_name ?? user?.user_metadata?.full_name ?? "ผู้ใช้";
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const rank = profile?.rank_position ? `#${profile.rank_position}` : "#—";
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar isAdmin={profile?.is_admin ?? false} />
      </div>

      {/* Top nav — offset by sidebar on md+ */}
      <div className="hidden md:block">
        <TopNav coins={coins} username={username} avatarUrl={avatarUrl} rank={rank} xp={xp} xpMax={level * 208} />
      </div>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass border-b border-[rgba(124,58,237,0.2)] z-30 flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center">
            <span className="text-yellow-400 text-xs">✦</span>
          </div>
          <span className="font-black gradient-gold text-base">ภาวนา</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 glass-gold px-2.5 py-1 rounded-lg">
          <Image src="/images/point2.png" alt="point" width={14} height={14} />
          <span className="text-yellow-400 text-xs font-bold">{coins.toLocaleString()}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 border border-purple-500/50 flex items-center justify-center text-xs font-bold">
          {username[0]?.toUpperCase()}
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-56 pt-14 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Coin fly animation layer */}
      <CoinFlyLayer />

      {/* Premium reward claim animation layer */}
      <RewardClaimFX />

      {/* Win celebration overlay (realtime) */}
      <WinNotificationLayer userId={user?.id ?? null} />

      {/* Terms consent — shows once until accepted */}
      <TermsConsentGate hasAccepted={!!profile?.terms_accepted_at} />
    </div>
  );
}
