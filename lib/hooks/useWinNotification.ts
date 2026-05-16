"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ResultEvent {
  type: "win" | "lose";
  coins: number;
  xp: number;
  predictionTitle: string;
  notificationId: string;
  predictionId?: string;
}

export function useWinNotification(userId: string | null) {
  const [resultEvent, setResultEvent] = useState<ResultEvent | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const dismiss = useCallback(() => {
    setResultEvent((prev) => {
      if (prev?.notificationId) {
        const supabase = createClient();
        supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", prev.notificationId)
          .then(() => {});
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    // Check for any pending (unread) win/lose notifications that were missed
    supabase
      .from("notifications")
      .select("id, type, body, data")
      .eq("user_id", userId)
      .in("type", ["win", "lose"])
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) return;
        const row = rows[0] as {
          id: string;
          type: string;
          body: string | null;
          data: { coins?: number; xp?: number; prediction_id?: string } | null;
        };
        const titleMatch = row.body?.match(/"([^"]+)"/);
        setResultEvent({
          type: row.type as "win" | "lose",
          coins: row.data?.coins ?? 0,
          xp: row.data?.xp ?? 0,
          predictionTitle: titleMatch?.[1] ?? "คำทำนาย",
          notificationId: row.id,
          predictionId: row.data?.prediction_id,
        });
      });

    // Ensure Realtime connection includes the user's JWT
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }
    });

    const channel = supabase
      .channel(`win-notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            type: string;
            body: string | null;
            data: { coins?: number; xp?: number; prediction_id?: string } | null;
          };

          console.log("[WinNotif] received row:", row);
          if (row.type !== "win" && row.type !== "lose") {
            console.log("[WinNotif] skipped type:", row.type);
            return;
          }
          console.log("[WinNotif] setting resultEvent!");

          const titleMatch = row.body?.match(/"([^"]+)"/);
          const predictionTitle = titleMatch?.[1] ?? "คำทำนาย";

          setResultEvent({
            type: row.type as "win" | "lose",
            coins: row.data?.coins ?? 0,
            xp: row.data?.xp ?? 0,
            predictionTitle,
            notificationId: row.id,
            predictionId: row.data?.prediction_id,
          });
        }
      )
      .subscribe((status) => {
        console.log("[WinNotif] channel status:", status);
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { resultEvent, dismiss };
}
