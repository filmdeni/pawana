"use client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import PredictionCard, { Prediction } from "@/components/PredictionCard";

const categories = ["ทั้งหมด", "ดราม่า", "เกม", "กีฬา", "การเงิน", "ไวรัล", "อื่นๆ"];

interface Props {
  predictions: Prediction[];
}

export default function PredictList({ predictions }: Props) {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      const matchCat = activeCategory === "ทั้งหมด" || p.category === activeCategory;
      const matchSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [predictions, activeCategory, search]);

  return (
    <>
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาหัวข้อ..."
            className="w-full bg-white/5 border border-[rgba(124,58,237,0.2)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`chip ${activeCategory === c ? "active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-4xl mb-3">🔮</p>
          <p className="text-sm">ไม่พบหัวข้อที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => <PredictionCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
