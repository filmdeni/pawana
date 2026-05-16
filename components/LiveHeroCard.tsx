"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import PredictionTicker from "@/components/PredictionTicker";

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
  bg_position: string;
  active: boolean;
}

function Line({ text }: { text: string }) {
  const parts = text.split(/\{([^}]+)\}/);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <span key={i}>{p}</span>;
        const pipe = p.indexOf("|");
        const label = pipe === -1 ? p : p.slice(0, pipe);
        const color = pipe === -1 ? "#ff6b9d" : p.slice(pipe + 1);
        return <span key={i} style={{ color, textShadow: `0 0 32px ${color}cc` }}>{label}</span>;
      })}
    </>
  );
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtMs(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function Countdown({ endsAt, heatLevel }: { endsAt: number; heatLevel: number }) {
  const [msLeft, setMsLeft] = useState(endsAt - Date.now());
  useEffect(() => {
    const iv = setInterval(() => setMsLeft(endsAt - Date.now()), 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{ background: "rgba(8,5,20,0.75)", border: "1px solid rgba(220,60,40,0.40)" }}>
      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>⏳</span>
      <span className="font-black tabular-nums"
        style={{ fontSize: "1.25rem", color: "#FF8A65", textShadow: "0 0 16px rgba(255,138,101,0.7)", letterSpacing: "0.06em" }}>
        {fmtMs(msLeft)}
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < heatLevel ? "fire-flicker" : ""}
            style={{ fontSize: i < heatLevel ? "0.7rem" : "0.55rem", opacity: i < heatLevel ? 1 : 0.12 }}>
            🔥
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LiveHeroCard() {
  const supabase = createClient();
  const router = useRouter();

  const [slides, setSlides]     = useState<HeroSlide[]>([]);
  const [idx, setIdx]           = useState(0);
  const [viewers, setViewers]   = useState(0);
  const [yesPct, setYesPct]     = useState(50);
  const [imgError, setImgError] = useState(false);
  const [yesUp, setYesUp]       = useState(false);
  const [endsAt, setEndsAt]     = useState(0);

  useEffect(() => {
    supabase.from("hero_slides").select("*").eq("active", true).order("sort_order")
      .then(({ data }) => { if (data && data.length > 0) setSlides(data); });
  }, []);

  const pred = slides[idx];

  useEffect(() => {
    if (!pred) return;
    const end = Date.now() + pred.duration_hours * 3_600_000;
    setEndsAt(end);
    setViewers(pred.viewers);
    setYesPct(pred.yes_pct);
    setImgError(false);
    const iv = setInterval(() => {
      const d = Math.random() > 0.48 ? 0.3 : -0.2;
      setYesUp(d > 0);
      setViewers(v => Math.max(100, v + Math.floor(Math.random() * 11 - 3)));
      setYesPct(p => Math.min(95, Math.max(5, p + d)));
    }, 4000);
    return () => clearInterval(iv);
  }, [idx, pred?.id]);

  if (!pred) return null;

  const yPct  = Math.round(yesPct);
  const noPct = 100 - yPct;
  const showBg = !!pred.bg_image && !imgError;

  return (
    <section
      className="relative rounded-2xl overflow-hidden w-full cursor-pointer"
      style={{ minHeight: 240 }}
      onClick={() => pred.prediction_id && router.push(`/predict/${pred.prediction_id}`)}
    >

      {/* Background */}
      {showBg ? (
        <Image key={pred.bg_image} src={pred.bg_image} alt="" fill
          sizes="(max-width: 1280px) 100vw, 800px" className="object-cover" priority
          style={{ pointerEvents: "none", objectPosition: pred.bg_position || "50% 50%" }}
          onError={() => setImgError(true)} />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#09061a 0%,#0f0a24 60%,#120d2a 100%)" }} />
      )}


      {/* Content */}
      <div className="relative z-10 flex flex-row" style={{ padding: "16px 16px 14px", gap: 0 }}>

        {/* LEFT: main content */}
        <div className="flex flex-col min-w-0" style={{ flex: "1 1 0", paddingRight: 16 }}>

          {/* Badges + timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest"
                style={{ background: "rgba(220,30,30,0.25)", border: "1px solid rgba(220,60,60,0.60)", color: "#ff7070" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: "#ff4444", boxShadow: "0 0 6px #f87171", animation: "live-pulse 1.2s ease-in-out infinite" }} />
                LIVE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(90,50,200,0.25)", border: "1px solid rgba(100,60,220,0.40)", color: "#b09aff" }}>
                {pred.category}
              </span>
            </div>
            <Countdown endsAt={endsAt} heatLevel={pred.heat_level} />
          </div>

          {/* Question */}
          <div className="flex flex-col mb-3" style={{ gap: "0.02em" }}>
            {pred.lines.map((line, i) => (
              <div key={i} className="font-black leading-[1.08] text-white"
                style={{ fontSize: "clamp(1.15rem,4vw,1.6rem)", textShadow: "0 2px 24px rgba(0,0,0,0.9)", letterSpacing: "-0.02em" }}>
                <Line text={line} />
              </div>
            ))}
          </div>

          {/* Signals */}
          <div className="flex items-center gap-3 mb-3 text-[10px] font-semibold" style={{ height: 16 }}>
            <span className="flex items-center gap-1.5 tabular-nums" style={{ color: "rgba(255,255,255,0.45)", minWidth: 120 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" style={{ boxShadow: "0 0 5px rgba(74,222,128,0.9)" }} />
              {viewers.toLocaleString()} คนกำลังดู
            </span>
            <span style={{ color: "#FF8A65" }}>🔥 กำลังเดือด</span>
            <span style={{ color: "#5ED3A6", visibility: yesUp ? "visible" : "hidden" }}>⚡ YES พุ่งเร็ว</span>
          </div>

          {/* Vote bar — full width */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex flex-col items-end flex-shrink-0" style={{ minWidth: 40 }}>
                <span className="font-black leading-none" style={{ fontSize: "1rem", color: "#5ED3A6", textShadow: "0 0 14px rgba(94,211,166,0.6)" }}>{yPct}%</span>
                <span className="text-[9px] font-semibold" style={{ color: "#5ED3A6", marginTop: 1 }}>{pred.yes_label}</span>
              </div>
              <div className="flex flex-1 rounded-full overflow-hidden" style={{ height: 7, background: "rgba(255,255,255,0.07)" }}>
                <div className="transition-all duration-1000" style={{ width: `${yPct}%`, background: "linear-gradient(90deg,#c2185b,#ef4444)", boxShadow: "0 0 10px rgba(239,68,68,0.5)", borderRadius: "9999px 0 0 9999px" }} />
                <div className="transition-all duration-1000" style={{ width: `${noPct}%`, background: "linear-gradient(90deg,#5b21b6,#8b5cf6)", boxShadow: "0 0 10px rgba(139,92,246,0.5)", borderRadius: "0 9999px 9999px 0" }} />
              </div>
              <div className="flex flex-col items-start flex-shrink-0" style={{ minWidth: 40 }}>
                <span className="font-black leading-none" style={{ fontSize: "1rem", color: "#a78bfa", textShadow: "0 0 14px rgba(167,139,250,0.6)" }}>{noPct}%</span>
                <span className="text-[9px] font-semibold" style={{ color: "#a78bfa", marginTop: 1 }}>{pred.no_label}</span>
              </div>
            </div>
          </div>

          {/* Vote buttons — full width */}
          <div className="grid grid-cols-2 gap-2 mb-auto">
            <button
              className="rounded-xl py-2 transition-all duration-200 active:scale-95 block text-left"
              style={{ background: "linear-gradient(135deg,rgba(185,28,28,0.70),rgba(220,38,38,0.55))", border: "1.5px solid rgba(239,68,68,0.50)" }}
              onClick={(e) => { e.stopPropagation(); router.push(`/predict/${pred.prediction_id}?vote=yes`); }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-black text-white">{pred.yes_btn}</span>
              </div>
              <div className="text-[10px] text-center mt-0.5" style={{ color: "rgba(255,255,255,0.50)" }}>อยู่ฝั่ง YES</div>
            </button>
            <button
              className="rounded-xl py-2 transition-all duration-200 active:scale-95 block text-left"
              style={{ background: "linear-gradient(135deg,rgba(88,28,135,0.65),rgba(109,40,217,0.50))", border: "1.5px solid rgba(139,92,246,0.50)" }}
              onClick={(e) => { e.stopPropagation(); router.push(`/predict/${pred.prediction_id}?vote=no`); }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm">🛡️</span>
                <span className="text-sm font-black text-white">{pred.no_btn}</span>
              </div>
              <div className="text-[10px] text-center mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>อยู่ฝั่ง NO</div>
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {slides.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? 20 : 8, height: 8, background: i === idx ? "#8B5CF6" : "rgba(255,255,255,0.25)", padding: 0, minWidth: 8 }} />
            ))}
          </div>
        </div>

        {/* RIGHT: vertical comment ticker — hidden on mobile */}
        <div
          className="hidden sm:flex flex-shrink-0 flex-col justify-end"
          style={{
            width: 220,
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            paddingLeft: 14,
          }}
        >
          <PredictionTicker height={125} />
        </div>

      </div>
    </section>
  );
}
