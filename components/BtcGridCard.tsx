"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getCurrentRound, placeBtcBet, getMyBet, getMyCoinBalance } from "@/lib/actions/btc";
import type { BtcRound, BtcBet } from "@/lib/actions/btc";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function get5mWindow(now = Date.now()) {
  const ms5 = 5 * 60 * 1000;
  const start = Math.floor(now / ms5) * ms5;
  return { start, end: start + ms5 };
}
function fmtPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Donut gauge (reuse same pattern as PredictionCard) ───────────────────────
function DonutGauge({ percent, color, size = 72 }: { percent: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeLinecap="round" strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: "stroke-dasharray 0.7s ease" }} />
    </svg>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────
export default function BtcGridCard() {
  const [price, setPrice] = useState<number | null>(null);
  const [sparkData, setSparkData] = useState<{ p: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundStart, setRoundStart] = useState(() => get5mWindow().start);
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [upPool, setUpPool] = useState(0);
  const [downPool, setDownPool] = useState(0);
  const [myChoice, setMyChoice] = useState<"up" | "down" | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [round, setRound] = useState<BtcRound | null>(null);
  const [myBet, setMyBet] = useState<BtcBet | null>(null);
  const [myCoins, setMyCoins] = useState<number | null>(null);
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [betAmt, setBetAmt] = useState(50);

  const priceRef = useRef<number | null>(null);
  const startPriceRef = useRef<number | null>(null);

  const syncRound = useCallback(async (start: number, end: number, sp: number) => {
    const r = await getCurrentRound(new Date(start).toISOString(), new Date(end).toISOString(), sp);
    if (!r) return;
    setRound(r);
    setUpPool(r.up_pool);
    setDownPool(r.down_pool);
    if (r.start_price) { setStartPrice(r.start_price); startPriceRef.current = r.start_price; }
    const [bet, coins] = await Promise.all([getMyBet(r.id), getMyCoinBalance()]);
    if (bet) { setMyBet(bet); setMyChoice(bet.direction); }
    setMyCoins(coins);
  }, []);

  // Binance WebSocket
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (evt) => {
      try {
        const p = parseFloat((JSON.parse(evt.data as string) as { p: string }).p);
        if (!isFinite(p)) return;
        const isFirst = priceRef.current === null;
        priceRef.current = p;
        setPrice(p);
        setSparkData(prev => [...prev, { p }].slice(-60));
        if (isFirst) { const { start, end } = get5mWindow(); syncRound(start, end, p); }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [syncRound]);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const { start, end } = get5mWindow(now);
      setTimeLeft(end - now);
      if (start !== roundStart) {
        setRoundStart(start);
        setMyChoice(null); setMyBet(null); setRound(null);
        setStartPrice(null); setUpPool(0); setDownPool(0);
        setBetError(null); setSparkData([]);
        startPriceRef.current = null;
        if (priceRef.current) syncRound(start, end, priceRef.current);
      }
    }, 500);
    return () => clearInterval(id);
  }, [roundStart, syncRound]);

  const totalPool = upPool + downPool;
  const hasPool = totalPool > 0;
  const upPct = hasPool ? Math.round((upPool / totalPool) * 100) : 50;
  const downPct = 100 - upPct;
  const locked = timeLeft > 0 && timeLeft <= 30_000;
  const lockSoon = timeLeft > 0 && timeLeft <= 60_000;
  const lockPrice = startPrice ?? price;
  const priceDiff = price !== null && lockPrice !== null ? price - lockPrice : null;
  const isUp = priceDiff !== null && priceDiff >= 0;

  // sparkline color: green if above lock, red if below
  const chartColor = isUp ? "#5ED3A6" : "#D96B6B";

  async function handleBet(dir: "up" | "down") {
    if (myChoice || locked || betLoading || !round) return;
    setBetError(null); setBetLoading(true);
    const { bet, error } = await placeBtcBet(round.id, dir, betAmt);
    setBetLoading(false);
    if (error) { setBetError(error); return; }
    setMyBet(bet); setMyChoice(dir);
    if (dir === "up") setUpPool(p => p + betAmt); else setDownPool(p => p + betAmt);
    setMyCoins(await getMyCoinBalance());
    setShowModal(false);
  }

  return (
    <>
      <Link href="/predict/btc-5m">
      <article className="glass card-hover rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer"
        style={{ border: lockSoon && !myChoice ? "1px solid rgba(255,184,107,0.35)" : "1px solid var(--border-card)" }}>

        {/* ── Hero: sparkline chart ── */}
        <div className="relative h-36 flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1200, #0e0e1a)" }}>

          {/* top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, #F7931A, #fbbf24, transparent)" }} />

          {/* sparkline fills hero */}
          <div className="absolute inset-0">
            {sparkData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="btcSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="p" stroke={chartColor} strokeWidth={2}
                    fill="url(#btcSparkGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-5xl opacity-20">₿</div>
            )}
          </div>

          {/* gradient fade bottom */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0e0e1a] to-transparent" />

          {/* Category pill */}
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: "rgba(202,138,4,0.85)" }}>
            การเงิน
          </span>

          {/* Live / lock badge */}
          {locked ? (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(75,57,117,0.6)", border: "1px solid rgba(111,75,255,0.3)", color: "#9D8FCC" }}>
              🔒 ปิดรับ
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[11px] font-black"
              style={{ background: "rgba(217,107,107,0.25)", border: "1px solid rgba(217,107,107,0.5)", color: "#f87171" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
              LIVE
            </span>
          )}

          {/* Live price overlay bottom-left */}
          <div className="absolute bottom-2.5 left-3">
            <div className="text-[18px] font-black tabular-nums leading-none" style={{ color: "#F3F1FF" }}>
              {price ? `$${fmtPrice(price)}` : "---"}
            </div>
            {priceDiff !== null && (
              <div className="text-[10px] font-bold mt-0.5" style={{ color: isUp ? "#5ED3A6" : "#D96B6B" }}>
                {isUp ? "▲" : "▼"} ${Math.abs(priceDiff).toFixed(2)}
              </div>
            )}
          </div>

          {/* Countdown bottom-right */}
          <div className="absolute bottom-2.5 right-3 text-right">
            <div className="font-mono font-black text-[18px] leading-none"
              style={{ color: lockSoon ? "#FFB86B" : "#F3F1FF" }}>
              {fmtCountdown(timeLeft)}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>เหลือเวลา</div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-3.5 pt-3 pb-3 flex flex-col gap-2.5 flex-1">

          {/* Title */}
          <h3 className="text-[14px] font-black text-white leading-snug">
            BTC ขึ้นหรือลงใน 5 นาที?
          </h3>

          {/* Voted badge */}
          {myChoice && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit"
              style={{ background: "rgba(111,75,255,0.15)", border: "1px solid rgba(111,75,255,0.35)", color: "#C4B5FD" }}>
              <span style={{ color: "#A78BFA" }}>✓</span>
              ทายแล้ว · {myChoice === "up" ? "▲ UP" : "▼ DOWN"} · {myBet?.amount ?? betAmt} ญาณ
            </div>
          )}

          {/* Donut + UP/DOWN odds */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <DonutGauge percent={upPct} color="#fbbf24" size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[14px] font-black text-white leading-none">{upPct}%</span>
                <span className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>UP</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {/* ราคาล็อค */}
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: "var(--text-muted)" }}>🎯 ราคาล็อค</span>
                <span className="font-bold tabular-nums" style={{ color: "#D7B56D" }}>
                  {lockPrice ? `$${fmtPrice(lockPrice)}` : "รอ..."}
                </span>
              </div>
              {/* Pool */}
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: "var(--text-muted)" }}>Pool รวม</span>
                <span className="font-bold" style={{ color: "var(--text-secondary)" }}>
                  {totalPool > 0 ? `${totalPool.toLocaleString()} ญาณ` : "รอผู้เล่น"}
                </span>
              </div>
              {/* WSBTC indicator */}
              <div className="flex items-center gap-1 text-[10px]" style={{ color: wsConnected ? "#5ED3A6" : "#756D8F" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                  background: "currentColor",
                  animation: wsConnected ? "pulse 1.5s ease-in-out infinite" : "none"
                }} />
                {wsConnected ? "Binance LIVE" : "กำลังเชื่อมต่อ..."}
              </div>
            </div>
          </div>

          {/* Error */}
          {betError && (
            <div className="px-3 py-2 rounded-xl text-xs font-semibold text-center"
              style={{ background: "rgba(217,107,107,0.1)", border: "1px solid rgba(217,107,107,0.25)", color: "#D96B6B" }}>
              {betError}
            </div>
          )}

          {/* Buttons */}
          {!myChoice ? (
            locked ? (
              <div className="py-3 rounded-xl text-center text-sm font-bold"
                style={{ background: "rgba(75,57,117,0.15)", border: "1px solid rgba(75,57,117,0.25)", color: "#756D8F" }}>
                🔒 ปิดรับการทาย
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-auto" onClick={e => { e.preventDefault(); setShowModal(true); }}>
                <button
                  className="py-2.5 rounded-xl text-[13px] font-black text-center transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(94,211,166,0.15)", border: "1px solid rgba(94,211,166,0.4)", color: "#5ED3A6" }}>
                  ▲ UP
                </button>
                <button
                  className="py-2.5 rounded-xl text-[13px] font-black text-center transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "rgba(217,107,107,0.15)", border: "1px solid rgba(217,107,107,0.4)", color: "#D96B6B" }}>
                  ▼ DOWN
                </button>
              </div>
            )
          ) : (
            // After bet: show win/lose status
            <div className="mt-auto">
              {priceDiff !== null && (
                <div className="flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold"
                  style={{
                    background: ((myChoice === "up" && priceDiff > 0) || (myChoice === "down" && priceDiff < 0))
                      ? "rgba(94,211,166,0.08)" : "rgba(217,107,107,0.08)",
                    border: `1px solid ${((myChoice === "up" && priceDiff > 0) || (myChoice === "down" && priceDiff < 0))
                      ? "rgba(94,211,166,0.25)" : "rgba(217,107,107,0.25)"}`,
                  }}>
                  <span style={{
                    color: ((myChoice === "up" && priceDiff > 0) || (myChoice === "down" && priceDiff < 0))
                      ? "#5ED3A6" : "#D96B6B"
                  }}>
                    {((myChoice === "up" && priceDiff > 0) || (myChoice === "down" && priceDiff < 0))
                      ? "🏆 กำลังชนะ!" : "💀 กำลังแพ้"}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>ประกาศผล {new Date(get5mWindow(roundStart).end).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-[11px] mt-auto pt-2 border-t border-white/[0.05]"
            style={{ color: "var(--text-muted)" }}>
            <span style={{ color: lockSoon ? "#FFB86B" : "var(--text-muted)" }}>
              ⏱ {fmtCountdown(timeLeft)}
            </span>
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/point2.png" alt="coin" className="w-3 h-3 object-contain" />
              {totalPool > 0 ? totalPool.toLocaleString() : "0"}
            </span>
            <span>
              👥 {Math.max(Math.floor(totalPool / 45), 0)}
            </span>
            {myCoins !== null && (
              <span className="ml-auto font-semibold" style={{ color: "#D7B56D" }}>
                {myCoins.toLocaleString()} ญาณ
              </span>
            )}
          </div>
        </div>
      </article>
      </Link>

      {/* ── Bet Modal ── */}
      {showModal && !myChoice && !locked && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(5,6,10,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>BTC ขึ้นหรือลง?</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ล็อคที่ {lockPrice ? `$${fmtPrice(lockPrice)}` : "---"} · เหลือ {fmtCountdown(timeLeft)}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-xl" style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {/* Amount */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: "var(--text-muted)" }}>จำนวน ญาณ</span>
                  {myCoins !== null && (
                    <span style={{ color: "var(--text-muted)" }}>
                      มี <span style={{ color: "#D7B56D", fontWeight: 700 }}>{myCoins.toLocaleString()}</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 50, 100, 200, 500].map(amt => {
                    const tooMuch = myCoins !== null && amt > myCoins;
                    return (
                      <button key={amt} onClick={() => !tooMuch && setBetAmt(amt)} disabled={tooMuch}
                        className="py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: betAmt === amt ? "#6F4BFF" : "var(--bg-panel)",
                          color: betAmt === amt ? "#fff" : tooMuch ? "#4B3975" : "var(--text-secondary)",
                          border: `1px solid ${betAmt === amt ? "#6F4BFF" : "var(--border-card)"}`,
                          opacity: tooMuch ? 0.4 : 1,
                        }}>
                        {amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {betError && (
                <div className="px-3 py-2 rounded-xl text-xs font-semibold text-center"
                  style={{ background: "rgba(217,107,107,0.1)", border: "1px solid rgba(217,107,107,0.25)", color: "#D96B6B" }}>
                  {betError}
                </div>
              )}

              {/* UP / DOWN */}
              <div className="grid grid-cols-2 gap-2.5">
                {(["up", "down"] as const).map(dir => {
                  const isUp = dir === "up";
                  const col = isUp ? "#5ED3A6" : "#D96B6B";
                  const pct = isUp ? upPct : downPct;
                  const pool = isUp ? upPool : downPool;
                  const estPayout = hasPool && (pool + betAmt) > 0
                    ? ((betAmt / (pool + betAmt)) * (totalPool + betAmt) * 0.95)
                    : betAmt * 1.9;
                  return (
                    <button key={dir} onClick={() => handleBet(dir)}
                      disabled={betLoading}
                      className="flex flex-col items-center py-4 rounded-2xl font-black transition-all hover:brightness-110 active:scale-95"
                      style={{
                        background: isUp ? "rgba(94,211,166,0.12)" : "rgba(217,107,107,0.12)",
                        border: `2px solid ${isUp ? "rgba(94,211,166,0.4)" : "rgba(217,107,107,0.4)"}`,
                        color: col, opacity: betLoading ? 0.5 : 1,
                      }}>
                      <span className="text-xl">{isUp ? "▲" : "▼"}</span>
                      <span className="text-base mt-0.5">{isUp ? "UP" : "DOWN"}</span>
                      <span className="text-xs mt-1 opacity-70">{pct}% เชื่อ</span>
                      <span className="text-[10px] mt-1" style={{ color: "#D7B56D" }}>
                        ≈ {estPayout.toFixed(0)} ญาณ
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[10px]" style={{ color: "rgba(117,109,143,0.6)" }}>
                กดเพื่อยืนยัน • ตัดเงินทันที • ผลประกาศอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
