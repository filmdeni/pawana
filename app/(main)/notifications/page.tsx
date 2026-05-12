import { getSessionUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import NotificationsClient from "./NotificationsClient";
import ParallaxBg from "@/components/ParallaxBg";

export interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
}

export default async function NotificationsPage() {
  const user = await getSessionUser().catch(() => null);

  let notifications: NotifRow[] = [];
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at, data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = (data ?? []) as NotifRow[];
  }

  return (
    <div className="relative">
      <ParallaxBg variant="blue" />
      <div className="relative" style={{ zIndex: 1 }}>
        <NotificationsClient notifications={notifications} />
      </div>
    </div>
  );
}
