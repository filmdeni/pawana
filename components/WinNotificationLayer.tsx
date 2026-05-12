"use client";
import dynamic from "next/dynamic";
import { useWinNotification } from "@/lib/hooks/useWinNotification";

const WinBanner = dynamic(() => import("@/components/WinBanner"), { ssr: false });

export default function WinNotificationLayer({ userId }: { userId: string | null }) {
  const { winEvent, dismiss } = useWinNotification(userId);

  if (!winEvent) return null;

  return (
    <WinBanner
      coins={winEvent.coins}
      xp={winEvent.xp}
      predictionTitle={winEvent.predictionTitle}
      onClose={dismiss}
    />
  );
}
