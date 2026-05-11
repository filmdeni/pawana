"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface VoteTotals {
  yesPool: number;
  noPool: number;
  participantCount: number;
}

export function useRealtimeVotes(predictionId: string, initial: VoteTotals) {
  const [totals, setTotals] = useState<VoteTotals>(initial);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to postgres_changes on votes table
    const channel = supabase
      .channel(`votes:${predictionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `prediction_id=eq.${predictionId}`,
        },
        (payload) => {
          const vote = payload.new as Record<string, unknown>;
          if (typeof vote?.choice !== "boolean" || typeof vote?.amount !== "number") return;
          const { choice, amount } = vote as { choice: boolean; amount: number };
          setTotals((prev) => ({
            yesPool: choice ? prev.yesPool + amount : prev.yesPool,
            noPool: !choice ? prev.noPool + amount : prev.noPool,
            participantCount: prev.participantCount + 1,
          }));
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") console.warn("[useRealtimeVotes] subscription error", predictionId);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [predictionId]);

  return totals;
}
