import BtcLiveCard from "@/components/BtcLiveCard";
import ParallaxBg from "@/components/ParallaxBg";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BtcFiveMinPage() {
  return (
    <div className="relative">
      <ParallaxBg />
      <div className="relative p-4 md:p-6 max-w-lg mx-auto" style={{ zIndex: 1 }}>
        <Link
          href="/predict"
          className="inline-flex items-center gap-2 mb-4 text-sm font-semibold transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <BtcLiveCard />
      </div>
    </div>
  );
}
