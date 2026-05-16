"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ResolutionState {
  resolution: boolean | null;
  resolutionIndex: number | null;
}

export function useRealtimeResolution(
  predictionId: string,
  initialResolution: boolean | null,
  initialResolutionIndex?: number | null
): ResolutionState {
  const [state, setState] = useState<ResolutionState>({
    resolution: initialResolution,
    resolutionIndex: initialResolutionIndex ?? null,
  });
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const alreadyResolved =
    initialResolution !== null || (initialResolutionIndex !== null && initialResolutionIndex !== undefined);

  useEffect(() => {
    if (alreadyResolved) return;

    const supabase = createClient();
    const channelName = `realtime:resolution:${predictionId}:${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "predictions",
          filter: `id=eq.${predictionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newResolution = typeof row?.resolution === "boolean" ? row.resolution : null;
          const newIndex = typeof row?.resolution_index === "number" ? row.resolution_index : null;
          if (newResolution !== null || newIndex !== null) {
            setState({ resolution: newResolution, resolutionIndex: newIndex });
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR")
          console.warn("[useRealtimeResolution] subscription error", predictionId);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [predictionId, alreadyResolved]);

  return state;
}
