"use client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import PredictionCard, { Prediction } from "@/components/PredictionCard";

const categories = ["ทั้งหมด", "ดราม่า", "เกม", "กีฬา", "การเงิน", "ไวรัล", "อื่นๆ"];

const sportsSubs = [
  { key: "ทั้งหมด",   label: "ทั้งหมด",   emoji: "🏅" },
  { key: "NBA",      label: "NBA",      emoji: "🏀" },
  { key: "Football", label: "Football", emoji: "⚽" },
  { key: "Boxing",   label: "Boxing",   emoji: "🥊" },
];

interface Props {
  predictions: Prediction[];
}

export default function PredictList({ predictions }: Props) {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [activeSport, setActiveSport] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  function handleCategoryClick(c: string) {
    setActiveCategory(c);
    setActiveSport("ทั้งหมด");
  }

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      const matchCat = activeCategory === "ทั้งหมด" || p.category === activeCategory;
      const matchSport =
        activeCategory !== "กีฬา" ||
        activeSport === "ทั้งหมด" ||
        p.category === activeSport || p.title.toLowerCase().includes(activeSport.toLowerCase());
      const matchSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSport && matchSearch;
    });
  }, [predictions, activeCategory, activeSport, search]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative w-full sm:flex-1 sm:min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาหัวข้อ..."
            className="w-full bg-white/5 border border-[rgba(124,58,237,0.2)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleCategoryClick(c)}
              className={`chip ${activeCategory === c ? "active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sports sub-filter */}
      {activeCategory === "กีฬา" && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {sportsSubs.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setActiveSport(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap
                ${activeSport === key
                  ? "bg-[rgba(255,112,67,0.15)] border-[rgba(255,112,67,0.5)] text-[#FF7043]"
                  : "bg-white/[0.03] border-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:bg-white/[0.06]"
                }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-4xl mb-3">🔮</p>
          <p className="text-sm">ไม่พบหัวข้อที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => <PredictionCard key={p.id} p={p} showComments />)}
        </div>
      )}
    </>
  );
}
