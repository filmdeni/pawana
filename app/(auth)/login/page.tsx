"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const { success } = useToast();

  async function handleGoogleLogin() {
    setGooglePending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
    <div className="w-full max-w-sm fade-in">
      <div className="glass-gold rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-purple-600/10 blur-2xl" />

        <div className="relative z-10">
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">ยินดีต้อนรับกลับ</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">เข้าสู่ระบบเพื่อทำนายอนาคต</p>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/70 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)]">รหัสผ่าน</label>
                <Link href="/forgot" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-[rgba(124,58,237,0.3)] rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/70 focus:bg-white/8 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-purple-400 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all glow-purple flex items-center justify-center gap-2 mt-2"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...</>
                : <>เข้าสู่ระบบ <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgba(124,58,237,0.2)]" />
            <span className="text-xs text-[var(--text-muted)]">หรือ</span>
            <div className="flex-1 h-px bg-[rgba(124,58,237,0.2)]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googlePending || isPending}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl glass border border-[rgba(124,58,237,0.2)] text-sm text-[var(--text-primary)] hover:border-purple-500/40 hover:bg-white/5 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googlePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googlePending ? "กำลังเปิด Google..." : "เข้าสู่ระบบด้วย Google"}
          </button>

          <p className="text-center text-sm text-[var(--text-muted)] mt-5">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
