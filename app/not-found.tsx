import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-6 float">🔮</div>
        <h1 className="text-6xl font-black gradient-gold glow-text-gold mb-2">404</h1>
        <p className="text-xl font-bold text-[var(--text-primary)] mb-2">ไม่พบหน้านี้</p>
        <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
          หน้าที่คุณค้นหาอาจถูกย้ายหรือไม่มีอยู่<br />
          แม้แต่นักพยากรณ์ก็มองไม่เห็น...
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-700 text-white glow-purple hover:from-purple-500 hover:to-violet-600 transition-all">
            <Home className="w-4 h-4" /> หน้าหลัก
          </Link>
          <Link href="/predict"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold glass border border-[rgba(124,58,237,0.3)] text-purple-300 hover:bg-white/10 transition-all">
            <Search className="w-4 h-4" /> ค้นหาคำทำนาย
          </Link>
        </div>
      </div>
    </div>
  );
}
