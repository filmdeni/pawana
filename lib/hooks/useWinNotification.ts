"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface WinEvent {
  coins: number;
  xp: number;
  predictionTitle: string;
  notificationId: string;
}

export function useWinNotification(userId: string | null) {
  const [winEvent, setWinEvent] = useState<WinEvent | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const dismiss = useCallback(() => setWinEvent(null), []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`win-notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            type: string;
            body: string | null;
            data: { coins?: number; xp?: number; prediction_id?: string } | null;
          };

          if (row.type !== "win") return;

          // Extract prediction title from body — format: "…title…" — …rest
          const titleMatch = row.body?.match(/"(.+?)"/);
          const predictionTitle = titleMatch?.[1] ?? "คำทำนาย";

          setWinEvent({
            coins: row.data?.coins ?? 0,
            xp: row.data?.xp ?? 0,
            predictionTitle,
            notificationId: row.id,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { winEvent, dismiss };
}
