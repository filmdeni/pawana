import Link from "next/link";
import { Star, TrendingUp, Shield, Users, Trophy, ArrowRight, Zap } from "lucide-react";

const features = [
  { icon: TrendingUp, title: "ทำนายแล้วรับพาราฯ",  desc: "เดิมพันด้วย Virtual Points รับผลตอบแทนเมื่อทำนายถูก",      color: "text-purple-400" },
  { icon: Trophy,     title: "แข่งขันชิงอันดับ",   desc: "ขึ้น Leaderboard พิสูจน์ว่าคุณคือนักพยากรณ์ที่ดีที่สุด",   color: "text-yellow-400" },
  { icon: Users,      title: "ชุมชนนักพยากรณ์",   desc: "แลกเปลี่ยนมุมมองกับชุมชนนักทำนายทั่วประเทศไทย",            color: "text-green-400" },
  { icon: Shield,     title: "ปลอดภัย 100%",       desc: "ไม่ใช่การพนัน ใช้ Virtual Points เพื่อความสนุกและทักษะ",   color: "text-blue-400" },
];

const stats = [
  { label: "นักพยากรณ์",         value: "24,891+", emoji: "🔮" },
  { label: "คำทำนายทั้งหมด",     value: "128,450+", emoji: "📊" },
  { label: "Virtual Points",      value: "฿2.4M+",  emoji: "🪙" },
  { label: "หัวข้อกำลังเปิด",   value: "1,248",   emoji: "⚡" },
];

const trending = [
  { title: "GTA 6 จะทำรายได้ทะลุ 1 พันล้าน?", cat: "เกม",    pct: 78, emoji: "🎮" },
  { title: "Bitcoin ทะลุ 100,000 ดอลลาร์ปีนี้?", cat: "การเงิน", pct: 55, emoji: "₿" },
  { title: "ดราม่าคู่รักดัง จะเลิกกัน?",       cat: "ดราม่า", pct: 72, emoji: "💔" },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen cosmic-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[rgba(124,58,237,0.2)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center glow-purple">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
          </div>
          <span className="text-lg font-black gradient-gold glow-text-gold">ภาวนา</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-purple-300 hover:text-white glass border border-[rgba(124,58,237,0.3)] hover:border-purple-500/50 transition-all">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register"
            className="px-4 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple">
            สมัครฟรี
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07] blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-yellow-400/30 text-yellow-400 text-sm font-semibold mb-6">
            <Star className="w-3.5 h-3.5" fill="currentColor" /> แพลตฟอร์มทำนายอันดับ 1 ของไทย
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            ทำนายอนาคต<br />
            <span className="gradient-gold glow-text-gold">สร้างตำนาน</span>
          </h1>
          <p className="text-lg text-purple-200/80 mb-8 leading-relaxed max-w-xl mx-auto">
            เข้าร่วมชุมชนนักพยากรณ์กว่า 24,000 คน ทำนายดราม่า เกม กีฬา และการเงิน
            รับ Virtual Points และขึ้นสู่ตำแหน่งระดับตำนาน
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple">
              เริ่มทำนายฟรี <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/predict"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base glass border border-white/20 text-purple-200 hover:bg-white/10 transition-all">
              ดูคำทำนาย
            </Link>
          </div>
          <p className="text-xs text-purple-400/60 mt-4">ฟรี · ไม่ใช่การพนัน · Virtual Points เท่านั้น</p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-14">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-gold rounded-2xl p-4 text-center card-hover">
              <p className="text-2xl mb-1">{s.emoji}</p>
              <p className="text-xl font-black gradient-gold">{s.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="px-6 pb-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-center text-[var(--text-primary)] mb-6">🔥 คำทำนายที่กำลังร้อน</h2>
          <div className="space-y-3">
            {trending.map((t) => (
              <div key={t.title} className="glass card-hover rounded-xl px-5 py-4 flex items-center gap-4 group">
                <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-purple-200 transition-colors truncate">{t.title}</p>
                  <span className="chip inline-block mt-1">{t.cat}</span>
                </div>
                <div className="w-14 h-14 relative flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#a855f7" strokeWidth="10"
                      strokeDasharray={`${t.pct * 2.39} ${100 * 2.39}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-purple-300">{t.pct}%</span>
                  </div>
                </div>
                <Link href="/register"
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/40 transition-all opacity-0 group-hover:opacity-100">
                  ทำนาย
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-center text-[var(--text-primary)] mb-8">
            ทำไมต้อง <span className="gradient-gold">ภาวนา</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="glass card-hover rounded-2xl p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="glass-gold rounded-3xl p-10 text-center relative overflow-hidden border border-[rgba(168,85,247,0.3)]">
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(76,29,149,0.5) 0%, rgba(18,18,31,0.8) 100%)" }} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
            <div className="relative z-10">
              <p className="text-4xl mb-3 float">🔮</p>
              <h2 className="text-2xl font-black text-white mb-2">พร้อมเป็นตำนานแล้วหรือยัง?</h2>
              <p className="text-sm text-purple-200/80 mb-6">สมัครฟรีวันนี้ รับ 1,000 พาราฯ เพื่อเริ่มต้น</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 transition-all glow-gold">
                สมัครฟรี รับ 1,000 พาราฯ <Zap className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(124,58,237,0.15)] py-6 px-6 text-center">
        <p className="text-xs text-purple-600">© 2024 ภาวนา · ไม่ใช่การพนัน · Virtual Points เท่านั้น</p>
      </footer>
    </div>
  );
}
