"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface HeroSlide {
  id: string;
  lines: string[];
  category: string;
  yes_pct: number;
  yes_label: string;
  no_label: string;
  yes_btn: string;
  no_btn: string;
  duration_hours: number;
  viewers: number;
  heat_level: number;
  prediction_id: string;
  bg_image: string;
  active: boolean;
}

function Line({ text }: { text: string }) {
  const parts = text.split(/\{([^}]+)\}/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <span key={i} style={{ color: "#ff6b9d", textShadow: "0 0 32px rgba(255,107,157,0.8), 0 0 8px rgba(255,107,157,0.4)" }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtMs(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export default function LiveHeroCard() {
  const supabase = createClient();

  const [slides, setSlides]     = useState<HeroSlide[]>([]);
  const [idx, setIdx]           = useState(0);
  const [msLeft, setMsLeft]     = useState(0);
  const [viewers, setViewers]   = useState(0);
  const [yesPct, setYesPct]     = useState(50);
  const [voted, setVoted]       = useState<"yes"|"no"|null>(null);
  const [imgError, setImgError] = useState(false);
  const [yesUp, setYesUp]       = useState(false);

  useEffect(() => {
    supabase
      .from("hero_slides")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data);
      });
  }, []);

  const pred = slides[idx];

  // reset live state when slide changes
  useEffect(() => {
    if (!pred) return;
    const endsAt = Date.now() + pred.duration_hours * 3_600_000;
    setMsLeft(endsAt - Date.now());
    setViewers(pred.viewers);
    setYesPct(pred.yes_pct);
    setVoted(null);
    setImgError(false);

    const iv = setInterval(() => {
      setMsLeft(endsAt - Date.now());
      setViewers(v => Math.max(100, v + Math.floor(Math.random() * 7 - 2)));
      setYesPct(p => {
        const d = Math.random() > 0.48 ? 0.2 : -0.1;
        setYesUp(d > 0);
        return Math.min(95, Math.max(5, p + d));
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [idx, pred?.id]);

  if (!pred) return null;

  const yPct   = Math.round(yesPct);
  const noPct  = 100 - yPct;
  const showBg = !!pred.bg_image && !imgError;

  return (
    <section className="relative rounded-2xl overflow-hidden" style={{ minHeight: 260, width: "100%" }}>

      {showBg && (
        <Image key={pred.bg_image} src={pred.bg_image} alt="" fill
          sizes="900px" className="object-cover object-right" priority
          style={{ filter: "brightness(0.55)", pointerEvents: "none" }}
          onError={() => setImgError(true)} />
      )}

      {!showBg && (
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg,#09061a 0%,#0f0a24 60%,#120d2a 100%)",
        }}/>
      )}

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(7,4,20,0.98) 0%, rgba(7,4,20,0.92) 35%, rgba(7,4,20,0.70) 55%, rgba(7,4,20,0.25) 75%, transparent 90%)",
      }}/>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to top, rgba(7,4,20,0.85) 0%, transparent 45%)",
      }}/>
      <div className="absolute pointer-events-none" style={{
        inset: 0,
        background: "radial-gradient(ellipse at -10% 20%, rgba(120,60,255,0.22) 0%, transparent 55%)",
      }}/>

      {/* ── Content: 2-column ── */}
      <div className="relative z-10 flex gap-3" style={{ padding: "18px 20px 16px" }}>

        {/* LEFT column */}
        <div className="flex flex-col gap-2.5 min-w-0" style={{ flex: "1 1 0" }}>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-widest"
              style={{ background:"rgba(220,30,30,0.25)", border:"1px solid rgba(220,60,60,0.60)", color:"#ff7070" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background:"#ff4444", boxShadow:"0 0 6px #f87171", animation:"live-pulse 1.2s ease-in-out infinite" }}/>
              LIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background:"rgba(90,50,200,0.25)", border:"1px solid rgba(100,60,220,0.40)", color:"#b09aff" }}>
              {pred.category}
            </span>
          </div>

          {/* Question */}
          <div className="flex flex-col" style={{ gap: "0.05em" }}>
            {pred.lines.map((line, i) => (
              <div key={i} className="font-black leading-[1.06] text-white"
                style={{ fontSize:"clamp(1.6rem,3.6vw,2.5rem)", textShadow:"0 2px 24px rgba(0,0,0,0.9)", letterSpacing:"-0.025em" }}>
                <Line text={line} />
              </div>
            ))}
          </div>

          {/* Signals */}
          <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
            <span className="flex items-center gap-1.5" style={{ color:"rgba(255,255,255,0.42)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow:"0 0 5px rgba(74,222,128,0.9)" }}/>
              {viewers.toLocaleString()} คนกำลังดู
            </span>
            <span style={{ color:"#FF8A65" }}>🔥 กำลังเดือด</span>
            {yesUp && <span style={{ color:"#5ED3A6" }}>⚡ YES พุ่งเร็ว</span>}
          </div>

          {/* Bar with flanking % */}
          <div className="flex items-center gap-2" style={{ width:"80%" }}>
            <div className="flex-shrink-0 flex flex-col items-end" style={{ minWidth: 60 }}>
              <div className="font-black leading-none" style={{ fontSize:"1.4rem", color:"#5ED3A6", textShadow:"0 0 16px rgba(94,211,166,0.55)" }}>{yPct}%</div>
              <div className="font-semibold" style={{ fontSize:"0.65rem", color:"#5ED3A6", marginTop:2 }}>{pred.yes_label}</div>
            </div>
            <div className="flex flex-1 rounded-full overflow-hidden" style={{ height:9, background:"rgba(255,255,255,0.07)" }}>
              <div className="transition-all duration-1000" style={{ width:`${yPct}%`, background:"linear-gradient(90deg,#c2185b,#ef4444)", boxShadow:"0 0 10px rgba(239,68,68,0.5)", borderRadius:"9999px 0 0 9999px" }}/>
              <div className="transition-all duration-1000" style={{ width:`${noPct}%`, background:"linear-gradient(90deg,#5b21b6,#8b5cf6)", boxShadow:"0 0 10px rgba(139,92,246,0.5)", borderRadius:"0 9999px 9999px 0" }}/>
            </div>
            <div className="flex-shrink-0 flex flex-col items-start" style={{ minWidth: 60 }}>
              <div className="font-black leading-none" style={{ fontSize:"1.4rem", color:"#a78bfa", textShadow:"0 0 16px rgba(167,139,250,0.55)" }}>{noPct}%</div>
              <div className="font-semibold" style={{ fontSize:"0.65rem", color:"#a78bfa", marginTop:2 }}>{pred.no_label}</div>
            </div>
          </div>

          {/* Vote buttons */}
          <div className="grid grid-cols-2 gap-2" style={{ width:"80%" }}>
            <button onClick={() => setVoted(voted==="yes" ? null : "yes")}
              className="rounded-xl py-2.5 transition-all duration-200 active:scale-95"
              style={voted==="yes" ? {
                background:"linear-gradient(135deg,#dc2626,#b91c1c)",
                border:"1.5px solid rgba(239,68,68,0.9)",
                boxShadow:"0 0 28px rgba(220,38,38,0.55)",
              } : {
                background:"linear-gradient(135deg,rgba(185,28,28,0.65),rgba(220,38,38,0.50))",
                border:"1.5px solid rgba(239,68,68,0.45)",
              }}>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-black text-white">{pred.yes_btn}</span>
              </div>
              <div className="text-[10px] text-center mt-0.5" style={{ color:"rgba(255,255,255,0.50)" }}>อยู่ฝั่ง YES</div>
            </button>
            <button onClick={() => setVoted(voted==="no" ? null : "no")}
              className="rounded-xl py-2.5 transition-all duration-200 active:scale-95"
              style={voted==="no" ? {
                background:"linear-gradient(135deg,#6d28d9,#5b21b6)",
                border:"1.5px solid rgba(139,92,246,0.9)",
                boxShadow:"0 0 28px rgba(109,40,217,0.55)",
              } : {
                background:"linear-gradient(135deg,rgba(88,28,135,0.60),rgba(109,40,217,0.45))",
                border:"1.5px solid rgba(139,92,246,0.45)",
              }}>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm">🛡️</span>
                <span className="text-sm font-black text-white">{pred.no_btn}</span>
              </div>
              <div className="text-[10px] text-center mt-0.5" style={{ color:"rgba(255,255,255,0.45)" }}>อยู่ฝั่ง NO</div>
            </button>
          </div>

          {/* Nav dots + link */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i===idx ? 24 : 10, height:10, background: i===idx ? "#8B5CF6" : "rgba(255,255,255,0.30)", padding:0, minWidth:10 }}/>
              ))}
            </div>
            <Link href={`/predict/${pred.prediction_id}`}
              className="text-[11px] font-bold hover:opacity-75 transition-opacity"
              style={{ color:"#a78bfa" }}>
              ดูรายละเอียด →
            </Link>
          </div>

        </div>{/* end LEFT column */}

        {/* RIGHT column */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0" style={{ width: 140 }}>

          {/* Countdown box */}
          <div className="flex flex-col items-center w-full px-3 py-3 rounded-2xl"
            style={{
              background:"rgba(8,5,20,0.85)",
              border:"1.5px solid rgba(220,60,40,0.60)",
              boxShadow:"0 0 28px rgba(220,50,30,0.28), inset 0 1px 0 rgba(255,100,60,0.08)",
            }}>
            <span className="text-[10px] font-semibold mb-1" style={{ color:"rgba(255,255,255,0.38)" }}>
              ⏳ เหลือเวลา
            </span>
            <span className="font-black tabular-nums"
              style={{ fontSize:"1.45rem", color:"#FF8A65", textShadow:"0 0 22px rgba(255,138,101,0.85)", letterSpacing:"0.05em", lineHeight:1 }}>
              {fmtMs(msLeft)}
            </span>
          </div>

          {/* Heat box */}
          <div className="flex flex-col items-center w-full px-3 py-2.5 rounded-2xl"
            style={{
              background:"rgba(8,5,20,0.75)",
              border:"1px solid rgba(255,100,30,0.25)",
            }}>
            <span className="text-[10px] font-semibold mb-1.5" style={{ color:"rgba(255,255,255,0.32)" }}>
              ✕ ความร้อนแรง
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({length:5}).map((_,i) => (
                <span key={i} className={i < pred.heat_level ? "fire-flicker" : ""}
                  style={{ fontSize: i < pred.heat_level ? "1.05rem" : "0.85rem", opacity: i < pred.heat_level ? 1 : 0.12 }}>
                  🔥
                </span>
              ))}
            </div>
          </div>

        </div>{/* end RIGHT column */}

      </div>{/* end 2-column */}
    </section>
  );
}
