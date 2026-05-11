import { createClient } from "@/lib/supabase/server";
import { Users, MessageSquare, CheckCircle, Clock } from "lucide-react";

async function getStats() {
  const supabase = await createClient();
  const [
    { count: totalUsers },
    { count: totalQuestions },
    { count: pendingQuestions },
    { count: resolvedQuestions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("predictions").select("*", { count: "exact", head: true }).not("resolution", "is", null),
  ]);
  return {
    totalUsers: totalUsers ?? 0,
    totalQuestions: totalQuestions ?? 0,
    pendingQuestions: pendingQuestions ?? 0,
    resolvedQuestions: resolvedQuestions ?? 0,
  };
}

async function getRecentPredictions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("predictions")
    .select("id, title, status, resolution, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([getStats(), getRecentPredictions()]);

  const statCards = [
    { label: "ผู้ใช้ทั้งหมด",       value: stats.totalUsers,       icon: Users,         color: "#6F4BFF" },
    { label: "คำถามทั้งหมด",        value: stats.totalQuestions,   icon: MessageSquare, color: "#88eeff" },
    { label: "รอการอนุมัติ",        value: stats.pendingQuestions, icon: Clock,         color: "#FFB86B" },
    { label: "เฉลยแล้ว",           value: stats.resolvedQuestions, icon: CheckCircle,   color: "#5ED3A6" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">ภาพรวมระบบ ภาวนา</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}22` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">{value.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent predictions */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A1F45]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">คำถามล่าสุด</h2>
        </div>
        <div className="divide-y divide-[#1E1535]">
          {recent.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">ยังไม่มีคำถาม</p>
          )}
          {recent.map((p: any) => (
            <div key={p.id} className="px-6 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{p.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  โดย {(p.profiles as any)?.username ?? "—"} · {new Date(p.created_at).toLocaleDateString("th-TH")}
                </p>
              </div>
              <StatusBadge status={p.status} resolution={p.resolution} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, resolution }: { status: string; resolution: boolean | null }) {
  if (resolution !== null) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#5ED3A622", color: "#5ED3A6" }}>
        เฉลยแล้ว
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#FFB86B22", color: "#FFB86B" }}>
        รออนุมัติ
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#D96B6B22", color: "#D96B6B" }}>
        ปฏิเสธ
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#6F4BFF22", color: "#7B61FF" }}>
      อนุมัติ
    </span>
  );
}
