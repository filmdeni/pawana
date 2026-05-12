"use client";
import { useState } from "react";
import { Search, Plus, TrendingUp, MessageSquare, Eye, Flame, ChevronUp } from "lucide-react";
import RankBadge from "@/components/RankBadge";
import ParallaxBg from "@/components/ParallaxBg";

const posts = [
  {
    id: 1,
    title: "GTA 6 จะทำรายได้ทะลุ 1 พันล้านดอลลาร์ใน 24 ชม. จริงไหม?",
    body: "เห็นตัวอย่างล่าสุดแล้วรู้สึกว่าเกมนี้ดีมาก กราฟิกสุดยอด...",
    author: "GameMasterX",
    tier: "gold" as const,
    time: "2 ชั่วโมงที่แล้ว",
    comments: 120,
    views: 2400,
    votes: 32,
    category: "เกม",
    hot: true,
  },
  {
    id: 2,
    title: "ดราม่าเดือด! อินฟลูเอนเซอร์ A จะออกมาขอโทษไทยจริงไหม?",
    body: "หลังจากที่ออกมาพูดเรื่องนี้ คิดว่าจะมีการขอโทษ...",
    author: "DramaQueen",
    tier: "silver" as const,
    time: "3 ชั่วโมงที่แล้ว",
    comments: 89,
    views: 1800,
    votes: 15,
    category: "ดราม่า",
  },
  {
    id: 3,
    title: "Bitcoin จะพุ่งทะลุ 100,000 ดอลลาร์ภายในปีนี้?",
    body: "ดูจากกราฟ on-chain และความเคลื่อนไหวของ whale...",
    author: "CryptoHunter",
    tier: "diamond" as const,
    time: "5 ชั่วโมงที่แล้ว",
    comments: 76,
    views: 1500,
    votes: 8,
    category: "การเงิน",
  },
  {
    id: 4,
    title: "ใครจะเป็นแชมเปี้ยน League of Legends ปีนี้?",
    body: "ทีมจากเกาหลีน่าจะยังครองอยู่แต่ทีม EU มาแรงมาก...",
    author: "EsportFan",
    tier: "bronze" as const,
    time: "6 ชั่วโมงที่แล้ว",
    comments: 64,
    views: 980,
    votes: 12,
    category: "เกม",
  },
  {
    id: 5,
    title: "เฌอปราง BNK48 จะประกาศข่าวดีในปีนี้ไหม?",
    body: "แฟนคลับหลายคนสังเกตว่าเธอมีความสุขมากขึ้นในช่วงนี้...",
    author: "PFanClub",
    tier: "silver" as const,
    time: "8 ชั่วโมงที่แล้ว",
    comments: 58,
    views: 870,
    votes: 7,
    category: "ดราม่า",
    hot: true,
  },
  {
    id: 6,
    title: "เงินบาทจะแข็งค่าขึ้นในโคมาส 3 นี้หรือไม่?",
    body: "ดูสัญญาณจาก Fed และ BOT แล้วมีแนวโน้มที่น่าสนใจ...",
    author: "MacroView",
    tier: "gold" as const,
    time: "10 ชั่วโมงที่แล้ว",
    comments: 43,
    views: 650,
    votes: 5,
    category: "การเงิน",
  },
];

const tabs = ["ทั้งหมด", "ยอดนิยม", "ใหม่ล่าสุด", "ดราม่า", "เกม", "กีฬา", "การเงิน", "ไวรัล"];

export default function BoardPage() {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");

  return (
    <div className="relative">
      <ParallaxBg variant="cyan" />
    <div className="relative p-4 md:p-6 max-w-screen-xl mx-auto" style={{ zIndex: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-black gradient-gold">กระดานสนทนา</h1>
          <p className="text-sm text-[var(--text-muted)]">แลกเปลี่ยนมุมมองกับนักพยากรณ์ทั่วไทย</p>
        </div>
        <button className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:from-purple-500 hover:to-violet-600 transition-all glow-purple flex-shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">สร้างโพสต์</span><span className="sm:hidden">โพสต์</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
        <input placeholder="ค้นหาในกระดาน..."
          className="w-full bg-white/5 border border-[rgba(124,58,237,0.2)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 transition-all" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`chip ${activeTab === t ? "active" : ""}`}>{t}</button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="glass card-hover rounded-xl p-4 cursor-pointer group relative">
            {post.hot && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-t-xl" />
            )}
            <div className="flex gap-4">
              {/* Vote col */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                <button className="w-7 h-7 rounded-lg hover:bg-purple-500/20 flex items-center justify-center text-[var(--text-muted)] hover:text-purple-400 transition-all">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-purple-400">+{post.votes}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="chip">{post.category}</span>
                  {post.hot && (
                    <span className="trending-badge flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <Flame className="w-3 h-3" /> ร้อน
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-100 leading-snug mb-1 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-1 mb-2">{post.body}</p>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-[10px] font-bold">{post.author[0]}</div>
                    <span>{post.author}</span>
                    <RankBadge tier={post.tier} />
                  </div>
                  <span className="text-purple-600">·</span>
                  <span>{post.time}</span>
                  <span className="flex items-center gap-0.5 ml-auto">
                    <MessageSquare className="w-3 h-3" /> {post.comments}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {post.views.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
}
