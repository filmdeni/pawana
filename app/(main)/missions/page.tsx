import { Zap, Trophy, Star, Clock } from "lucide-react";
import MissionCard from "@/components/MissionCard";
import XPBar from "@/components/XPBar";
import ParallaxBg from "@/components/ParallaxBg";
import { getSessionUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { getClaimedMissionSlugs } from "@/lib/actions/missions";

function getPeriodKey(type: "daily" | "weekly") {
  const now = new Date();
  if (type === "daily") return now.toISOString().slice(0, 10); // 2025-05-11
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const year = monday.getFullYear();
  const week = Math.ceil(((monday.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export default async function MissionsPage() {
  const user = await getSessionUser().catch(() => null);
  const supabase = await createClient();

  // --- Fetch real stats from DB ---
  let voteCountToday = 0;
  let voteCountWeek = 0;
  let commentCountToday = 0;
  let correctVotes = 0;
  let totalSpent = 0;
  let streak = 0;
  let xp = 0;
  let level = 1;
  let claimed = new Set<string>();

  if (user) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    const [todayVotes, weekVotes, allVotes, todayComments, profile, claimedSlugs] = await Promise.all([
      supabase.from("votes").select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
      supabase.from("votes").select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString()),
      supabase.from("votes").select("amount, choice, predictions(resolution)")
        .eq("user_id", user.id),
      supabase.from("comments").select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
      supabase.from("profiles").select("streak, xp, level, correct_predictions, total_predictions")
        .eq("id", user.id).single(),
      getClaimedMissionSlugs(user.id),
    ]);

    voteCountToday = todayVotes.count ?? 0;
    voteCountWeek = weekVotes.count ?? 0;
    commentCountToday = todayComments.count ?? 0;

    if (allVotes.data) {
      totalSpent = allVotes.data.reduce((s, v) => s + (v.amount ?? 0), 0);
      correctVotes = allVotes.data.filter((v) => {
        const pred = v.predictions as unknown as { resolution: boolean | null } | null;
        return pred?.resolution != null && pred.resolution === v.choice;
      }).length;
    }

    streak = profile.data?.streak ?? 0;
    xp = profile.data?.xp ?? 0;
    level = profile.data?.level ?? 1;
    claimed = new Set(claimedSlugs);
  }

  const d = (slug: string | null, p: number, t: number) => ({ slug, progress: p, total: t, done: !!slug && claimed.has(slug) });

  const daily = [
    { label: "ทำนาย 3 หัวข้อ",          reward: 150,  ...d("daily_predict", Math.min(voteCountToday, 3), 3) },
    { label: "แสดงความคิดเห็น 1 ครั้ง",  reward: 100,  ...d("daily_comment", Math.min(commentCountToday, 1), 1) },
    { label: "ล็อกอินประจำวัน",           reward: 50,   ...d("daily_login",   user ? 1 : 0, 1) },
  ];

  const weekly = [
    { label: "ทำนายถูก 5 ครั้ง",  reward: 500,  ...d("weekly_win5",      Math.min(correctVotes, 5),   5)  },
    { label: "เชิญเพื่อน 1 คน",   reward: 1000, ...d("weekly_invite",    0, 1) },
    { label: "ทำนาย 10 หัวข้อ",   reward: 300,  ...d("weekly_predict10", Math.min(voteCountWeek, 10), 10) },
  ];

  const special = [
    { label: "ทำนายถูก 100 ครั้ง (ตลอดกาล)", reward: 5000, ...d("special_100win",   Math.min(correctVotes, 100), 100)   },
    { label: "สตรีค 30 วัน",                  reward: 3000, ...d("special_streak30", Math.min(streak, 30),        30)    },
    { label: "ใช้ญาณฯ รวม 10,000",           reward: 2000, ...d("special_spend10k", Math.min(totalSpent, 10000), 10000) },
  ];

  const dailyDone  = daily.filter((m)   => m.progress >= m.total).length;
  const weeklyDone = weekly.filter((m)  => m.progress >= m.total).length;
  const specialDone = special.filter((m) => m.progress >= m.total).length;

  return (
    <div className="relative">
      <ParallaxBg variant="emerald" />
    <div className="relative p-4 md:p-6 max-w-3xl mx-auto space-y-5 md:space-y-6" style={{ zIndex: 1 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-black gradient-gold">ภารกิจ</h1>
          <p className="text-sm text-[var(--text-muted)]">ทำภารกิจรับญาณฯ และ XP เพิ่มเติม</p>
        </div>
      </div>

      {/* Progress overview */}
      <div className="glass-gold rounded-xl p-5 grid grid-cols-3 gap-4">
        {[
          { label: "รายวัน",     done: dailyDone,   total: daily.length,   icon: <Clock  className="w-4 h-4 text-blue-400"   />, color: "#60a5fa" },
          { label: "รายสัปดาห์", done: weeklyDone,  total: weekly.length,  icon: <Star   className="w-4 h-4 text-yellow-400" />, color: "#f4c24a" },
          { label: "พิเศษ",      done: specialDone, total: special.length, icon: <Trophy className="w-4 h-4 text-purple-400" />, color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="flex justify-center mb-1.5">{s.icon}</div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{s.done}/{s.total}</p>
            <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s.done / s.total) * 100}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Daily */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> ภารกิจประจำวัน
          </h2>
          <span className="text-xs text-[var(--text-muted)]">รีเซ็ตทุกเที่ยงคืน</span>
        </div>
        <div className="space-y-2">
          {daily.map((m, i) => <MissionCard key={i} m={m} />)}
        </div>
      </section>

      {/* Weekly */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> ภารกิจรายสัปดาห์
          </h2>
          <span className="text-xs text-[var(--text-muted)]">รีเซ็ตทุกวันจันทร์</span>
        </div>
        <div className="space-y-2">
          {weekly.map((m, i) => <MissionCard key={i} m={m} />)}
        </div>
      </section>

      {/* Special */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" /> ภารกิจพิเศษ (ตลอดกาล)
          </h2>
        </div>
        <div className="space-y-2">
          {special.map((m, i) => <MissionCard key={i} m={m} />)}
        </div>
      </section>

      {/* XP */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">XP สะสม</h3>
        <XPBar current={xp} max={level * 208} level={level} />
        <p className="text-xs text-[var(--text-muted)] mt-2">ทำภารกิจครบเพื่อรับ +150 XP โบนัส</p>
      </div>
    </div>
    </div>
  );
}
