"use client";
import { useState, useTransition } from "react";
import { Bell, Shield, Palette, Globe, LogOut, ChevronRight, Smartphone, Loader2 } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import ParallaxBg from "@/components/ParallaxBg";

const sections = [
  {
    title: "การแจ้งเตือน",
    icon: Bell,
    color: "text-purple-400",
    settings: [
      { label: "แจ้งเตือนเมื่อทำนายถูก", key: "notif_win", type: "toggle" },
      { label: "แจ้งเตือนภารกิจใหม่", key: "notif_mission", type: "toggle" },
      { label: "แจ้งเตือนความคิดเห็น", key: "notif_comment", type: "toggle" },
      { label: "แจ้งเตือนอีเมล", key: "notif_email", type: "toggle" },
    ],
  },
  {
    title: "ความเป็นส่วนตัว",
    icon: Shield,
    color: "text-green-400",
    settings: [
      { label: "แสดงโปรไฟล์สาธารณะ", key: "public_profile", type: "toggle" },
      { label: "แสดงสถิติการทำนาย", key: "show_stats", type: "toggle" },
      { label: "แสดงในอันดับ", key: "show_rank", type: "toggle" },
    ],
  },
  {
    title: "การแสดงผล",
    icon: Palette,
    color: "text-yellow-400",
    settings: [
      { label: "โหมดมืด (เปิดอยู่)", key: "dark_mode", type: "toggle" },
      { label: "เอฟเฟกต์อนิเมชัน", key: "animations", type: "toggle" },
      { label: "เสียงอินเตอร์เฟซ", key: "sounds", type: "toggle" },
    ],
  },
];

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => { logoutAction(); });
  }

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notif_win: true,
    notif_mission: true,
    notif_comment: false,
    notif_email: true,
    public_profile: true,
    show_stats: true,
    show_rank: true,
    dark_mode: true,
    animations: true,
    sounds: false,
  });

  const toggle = (key: string) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  return (
    <div className="relative">
      <ParallaxBg variant="slate" />
    <div className="relative p-4 md:p-6 max-w-2xl mx-auto space-y-4" style={{ zIndex: 1 }}>
      <div className="mb-6">
        <h1 className="text-xl font-black gradient-gold">ตั้งค่า</h1>
        <p className="text-sm text-[var(--text-muted)]">จัดการบัญชีและการตั้งค่าของคุณ</p>
      </div>

      {/* Profile section */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 border-2 border-purple-500/50 flex items-center justify-center text-2xl font-black">
              M
            </div>
            <div className="absolute -inset-1 rounded-full border border-purple-500/20 aura-ring" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[var(--text-primary)]">MysticPredictor</p>
            <p className="text-sm text-purple-400">นักพยากรณ์อันดับ #24</p>
            <p className="text-xs text-[var(--text-muted)]">mysticpredictor@email.com</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold glass border border-[rgba(124,58,237,0.3)] text-purple-300 hover:bg-white/10 transition-all">
            แก้ไข
          </button>
        </div>
      </div>

      {/* Toggle sections */}
      {sections.map((sec) => (
        <div key={sec.title} className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgba(124,58,237,0.15)] flex items-center gap-2">
            <sec.icon className={`w-4 h-4 ${sec.color}`} />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">{sec.title}</h2>
          </div>
          <div className="divide-y divide-[rgba(124,58,237,0.1)]">
            {sec.settings.map((s) => (
              <div key={s.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors">
                <span className="text-sm text-[var(--text-primary)]">{s.label}</span>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(s.key)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${toggles[s.key] ? "bg-purple-600 glow-purple" : "bg-white/10"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${toggles[s.key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Account actions */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[rgba(124,58,237,0.15)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">บัญชี</h2>
        </div>
        {[
          { label: "เปลี่ยนรหัสผ่าน", icon: Shield, desc: "อัปเดตความปลอดภัย" },
          { label: "ภาษา", icon: Globe, desc: "ภาษาไทย" },
          { label: "อุปกรณ์ที่เชื่อมต่อ", icon: Smartphone, desc: "2 อุปกรณ์" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors cursor-pointer border-b border-[rgba(124,58,237,0.1)]">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-sm text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
        ))}
        <div className="px-5 py-3.5">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors w-full disabled:opacity-40"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass rounded-2xl p-5 border border-red-500/20">
        <h2 className="text-sm font-bold text-red-400 mb-3">โซนอันตราย</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">การลบบัญชีไม่สามารถย้อนกลับได้ ญาณฯ และข้อมูลทั้งหมดจะหายไป</p>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
          ลบบัญชี
        </button>
      </div>
    </div>
    </div>
  );
}
