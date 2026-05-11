"use client";
import { useState } from "react";
import CommentSection from "@/components/CommentSection";
import { Clock, User } from "lucide-react";

function closingLabel(endsAt: string): string {
  return new Date(endsAt).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
  });
}

interface TabsSectionProps {
  predictionId: string;
  description: string;
  creator: string;
  endsAt: string;
}

export default function TabsSection({ predictionId, description, creator, endsAt }: TabsSectionProps) {
  const [tab, setTab] = useState<"chat" | "info" | "participants">("chat");

  const tabs = [
    { key: "chat" as const, label: "บทสนทนา" },
    { key: "info" as const, label: "ข้อมูล" },
    { key: "participants" as const, label: "ผู้เข้าร่วม" },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: "rgba(124,58,237,0.2)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              tab === t.key
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-3 md:p-5">
        {tab === "chat" && <CommentSection predictionId={predictionId} />}

        {tab === "info" && (
          <div className="space-y-3 text-sm">
            {description && (
              <p className="text-[var(--text-muted)] leading-relaxed">{description}</p>
            )}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  <User className="w-3.5 h-3.5" /> ผู้สร้าง
                </span>
                <span className="font-semibold text-purple-300">{creator}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5" /> วันปิดรับ
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{closingLabel(endsAt)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === "participants" && (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            Coming soon
          </p>
        )}
      </div>
    </div>
  );
}
