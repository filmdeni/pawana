"use client";
import dynamic from "next/dynamic";
import { useWinNotification } from "@/lib/hooks/useWinNotification";

const WinBanner = dynamic(() => import("@/components/WinBanner"), { ssr: false });
const LoserBanner = dynamic(() => import("@/components/LoserBanner"), { ssr: false });

export default function WinNotificationLayer({ userId }: { userId: string | null }) {
  const { resultEvent, dismiss } = useWinNotification(userId);

  if (!resultEvent) return null;

  if (resultEvent.type === "win") {
    return (
      <WinBanner
        coins={resultEvent.coins}
        xp={resultEvent.xp}
        predictionTitle={resultEvent.predictionTitle}
        onClose={dismiss}
      />
    );
  }

  return (
    <LoserBanner
      xp={resultEvent.xp}
      predictionTitle={resultEvent.predictionTitle}
      onClose={dismiss}
    />
  );
}
