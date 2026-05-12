"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const { success } = useToast();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  async function handleGoogleLogin() {
    setGooglePending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        success("ยินดีต้อนรับกลับ! 🔮", "เข้าสู่ระบบสำเร็จ");
      }
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex min-h-[520px] rounded-2xl overflow-hidden shadow-2xl fade-in"
      style={{ border: "1px solid rgba(111,75,255,0.25)" }}>

      {/* ── Left panel — Banner image ─────────────────────────────── */}
      <div className="hidden md:flex flex-col items-end justify-end flex-1 relative overflow-hidden"
        style={{ minHeight: "520px" }}>

        {/* Banner bg — object-position centers the hooded figure */}
        <img
          src="/images/loginbanner.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center center" }}
        />

        {/* Dark gradient overlay — bottom-heavy so text is readable */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(5,3,15,0.35) 0%, rgba(5,3,15,0.15) 40%, rgba(5,3,15,0.75) 85%, rgba(5,3,15,0.95) 100%)" }} />

        {/* Branding — bottom left */}
        <div className="relative z-10 p-8 w-full">
          <h2 className="text-3xl font-black gradient-gold glow-text-gold mb-1">ภาวนา</h2>
          <p className="text-sm text-purple-200/80 leading-relaxed mb-5">
            ทำนายอนาคต · เดิมพันความเชื่อ · สร้างตำนาน
          </p>
          <div className="flex gap-5">
            {[["🔮", "ทำนาย"], ["⚡", "เรียลไทม์"], ["🏆", "แข่งขัน"]].map(([icon, label]) => (
              <div key={label} className="text-center">
                <div className="text-lg mb-0.5">{icon}</div>
                <div className="text-[10px] text-purple-300/70 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — Login form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-10 relative"
        style={{ background: "rgba(14,11,24,0.98)" }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(111,75,255,0.6), transparent)" }} />

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6F4BFF, #4B3975)" }}>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <span className="text-xl font-black gradient-gold">ภาวนา</span>
        </div>

        <div className="space-y-1 mb-7">
          <h1 className="text-2xl font-black text-[var(--text-primary)]">ยินดีต้อนรับกลับ</h1>
          <p className="text-sm text-[var(--text-muted)]">เข้าสู่ระบบเพื่อเริ่มทำนาย</p>
        </div>

        {/* Google button — prominent */}
        <button
          onClick={handleGoogleLogin}
          disabled={googlePending || isPending}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-primary)",
          }}
        >
          {googlePending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googlePending ? "กำลังเปิด Google..." : "เข้าสู่ระบบด้วย Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "rgba(111,75,255,0.2)" }} />
          <span className="text-xs text-[var(--text-muted)]">หรือใช้อีเมล</span>
          <div className="flex-1 h-px" style={{ background: "rgba(111,75,255,0.2)" }} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm fade-in"
            style={{ background: "rgba(217,107,107,0.1)", border: "1px solid rgba(217,107,107,0.3)", color: "#D96B6B" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(111,75,255,0.6)" }} />
            <input
              name="email"
              type="email"
              placeholder="อีเมลของคุณ"
              required
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(111,75,255,0.25)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(111,75,255,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(111,75,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(111,75,255,0.6)" }} />
            <input
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="รหัสผ่าน"
              required
              className="w-full rounded-xl pl-10 pr-11 py-3 text-sm transition-all focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(111,75,255,0.25)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(111,75,255,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(111,75,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--text-muted)" }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot" className="text-xs transition-colors"
              style={{ color: "rgba(111,75,255,0.8)" }}>
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: "linear-gradient(135deg, #4B3975, #6F4BFF)",
              boxShadow: "0 0 28px rgba(111,75,255,0.35)",
            }}
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...</>
              : "เข้าสู่ระบบ"
            }
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-semibold transition-colors" style={{ color: "#7B61FF" }}>
            สมัครฟรี
          </Link>
        </p>
      </div>
    </div>
  );
}
