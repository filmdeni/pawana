import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, MessageSquare, LogOut, Image as ImageIcon } from "lucide-react";
import { getSessionUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

const adminNav = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/questions", label: "คำถาม",       icon: MessageSquare },
  { href: "/admin/hero",      label: "Hero Banner", icon: ImageIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, username")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-global)" }}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-52 flex flex-col glass border-r border-[rgba(124,58,237,0.2)] z-40">
        <div className="px-4 pt-5 pb-4 border-b border-[rgba(124,58,237,0.15)]">
          <Link href="/admin" className="flex flex-col items-center gap-1">
            <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/5" }}>
              <Image src="/images/logo.png" alt="logo" fill sizes="180px" className="object-contain" />
            </div>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-all"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1E1535]">
          <p className="text-xs text-[var(--text-muted)] px-3 mb-2 truncate">{profile.username}</p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-all"
          >
            <LogOut className="w-4 h-4" />
            กลับสู่แอป
          </Link>
        </div>
      </aside>

      <main className="ml-52 flex-1 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
