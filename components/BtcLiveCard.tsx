"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { getCurrentRound, placeBtcBet, getMyBet, getMyCoinBalance } from "@/lib/actions/btc";
import type { BtcRound, BtcBet } from "@/lib/actions/btc";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid, ReferenceArea,
} from "recharts";

interface PricePoint { t: number; price: number }

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

// Target label badge on right side of reference line
function TargetLabel({ viewBox, myChoice }: { viewBox?: { x?: number; y?: number; width?: number }; myChoice: "up" | "down" | null }) {
  if (!viewBox) return null;
  const { x = 0, y = 0, width = 0 } = viewBox;
  const bw = 56; const bh = 20;
  return (
    <g>
      <rect x={x + width - bw + 10} y={y - bh / 2} width={bw} height={bh} rx={5} fill="#374151" />
      <text x={x + width - bw / 2 + 10} y={y + 5} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">
        {myChoice === "up" ? "🎯 UP" : myChoice === "down" ? "🎯 DOWN" : "Target"}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: PricePoint; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1430", border: "1px solid #2A1F45", borderRadius: 8, padding: "6px 10px" }}>
      <div style={{ color: "#756D8F", fontSize: 10 }}>
        {new Date(payload[0].payload.t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
      </div>
      <div style={{ color: "#F3F1FF", fontWeight: "bold", fontSize: 13 }}>${fmtPrice(payload[0].value)}</div>
    </div>
  );
}

// Animated price ticker
function PriceTicker({ value, prefix = "" }: { value: number | null; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value === null) return;
    if (prev.current !== null && value !== prev.current) {
      setDir(value > prev.current ? "up" : "down");
      setTimeout(() => setDir(null), 800);
    }
    prev.current = value;
    setDisplay(value);
  }, [value]);
  const color = dir === "up" ? "#5ED3A6" : dir === "down" ? "#D96B6B" : "#F3F1FF";
  return (
    <span style={{ color, transition: "color 0.4s", fontVariantNumeric: "tabular-nums" }}>
      {prefix}{display !== null ? fmtPrice(display) : "---"}
    </span>
  );
}

export default function BtcLiveCard() {
  const [price, setPrice] = useState<number | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [roundStart, setRoundStart] = useState(() => get5mWindow().start);
  const [roundEnd, setRoundEnd] = useState(() => get5mWindow().end);
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [upPool, setUpPool] = useState(0);
  const [downPool, setDownPool] = useState(0);
  const [myChoice, setMyChoice] = useState<"up" | "down" | null>(null);
  const [betAmt, setBetAmt] = useState(50);
  const [wsConnected, setWsConnected] = useState(false);
  const [round, setRound] = useState<BtcRound | null>(null);
  const [myBet, setMyBet] = useState<BtcBet | null>(null);
  const [myCoins, setMyCoins] = useState<number | null>(null);
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);

  const priceRef = useRef<number | null>(null);
  const startPriceRef = useRef<number | null>(null);

  // Sync round with DB
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
    let lastChart = 0;
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
        if (isFirst) { const { start, end } = get5mWindow(); syncRound(start, end, p); }
        const now = Date.now();
        if (now - lastChart > 5000) { lastChart = now; setPricePoints(prev => [...prev, { t: now, price: p }].slice(-60)); }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [syncRound]);

  // Countdown + rollover
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const { start, end } = get5mWindow(now);
      setTimeLeft(end - now);
      if (start !== roundStart) {
        setRoundStart(start); setRoundEnd(end);
        setPricePoints([]); setMyChoice(null); setMyBet(null);
        setRound(null); setStartPrice(null); setBetError(null);
        setUpPool(0); setDownPool(0);
        startPriceRef.current = null;
        if (priceRef.current) syncRound(start, end, priceRef.current);
      }
    }, 500);
    return () => clearInterval(id);
  }, [roundStart, syncRound]);

  // Derived
  const totalPool = upPool + downPool;
  const hasPool = totalPool > 0;
  const upPct = hasPool ? Math.round((upPool / totalPool) * 100) : 50;
  const downPct = 100 - upPct;
  const locked = timeLeft > 0 && timeLeft <= 30_000;
  const lockSoon = timeLeft > 0 && timeLeft <= 60_000;
  const lockPrice = startPrice ?? price;
  const priceDiff = price !== null && lockPrice !== null ? price - lockPrice : null;
  const roundPct = timeLeft > 0 ? ((300_000 - timeLeft) / 300_000) * 100 : 100;
  const isWinning = myChoice !== null && priceDiff !== null &&
    ((myChoice === "up" && priceDiff > 0) || (myChoice === "down" && priceDiff < 0));

  // Payout estimate
  const myPool = myChoice === "up" ? upPool : downPool;
  const estPayout = hasPool && (myPool + betAmt) > 0
    ? (betAmt / (myPool + betAmt)) * (totalPool + betAmt) * 0.95
    : betAmt * 1.9;

  // Chart
  const prices = pricePoints.map(p => p.price);
  if (price) prices.push(price);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const pad = (maxP - minP) * 0.4 || 30;

  async function handleBet(dir: "up" | "down") {
    if (myChoice || locked || betLoading || !round) return;
    setBetError(null); setBetLoading(true);
    const { bet, error } = await placeBtcBet(round.id, dir, betAmt);
    setBetLoading(false);
    if (error) { setBetError(error); return; }
    setMyBet(bet); setMyChoice(dir);
    if (dir === "up") setUpPool(p => p + betAmt); else setDownPool(p => p + betAmt);
    setMyCoins(await getMyCoinBalance());
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(111,75,255,0.06)",
    }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 gap-3" style={{
        background: "linear-gradient(135deg, rgba(111,75,255,0.07) 0%, transparent 100%)",
        borderBottom: "1px solid var(--border-card)",
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F7931A, #c97a10)", color: "#fff" }}>
            ₿
          </div>
          <div>
            <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>BTC ขึ้นหรือลงใน 5 นาที?</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: wsConnected ? "rgba(94,211,166,0.12)" : "rgba(117,109,143,0.15)", color: wsConnected ? "#5ED3A6" : "#756D8F" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor", display: "inline-block",
                  animation: wsConnected ? "pulse 1.5s ease-in-out infinite" : "none" }} />
                {wsConnected ? "LIVE" : "กำลังเชื่อมต่อ"}
              </span>
              {myCoins !== null && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  ยอดคงเหลือ <span style={{ color: "var(--gold)", fontWeight: 700 }}>{myCoins.toLocaleString()} ญาณ</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono font-black text-3xl leading-none"
            style={{ color: locked ? "#756D8F" : lockSoon ? "#FFB86B" : "#F3F1FF", letterSpacing: "0.04em" }}>
            {fmtCountdown(timeLeft)}
          </div>
          <div className="text-[10px] mt-0.5 font-semibold"
            style={{ color: locked ? "#756D8F" : lockSoon ? "#FFB86B" : "#756D8F" }}>
            {locked ? "🔒 ปิดรับแล้ว" : lockSoon ? "⚡ ใกล้ปิด" : "เหลือเวลา"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(42,31,69,0.6)" }}>
        <div style={{
          height: "100%", width: `${roundPct}%`,
          background: locked ? "#4B3975" : lockSoon ? "linear-gradient(90deg,#FFB86B,#e8960a)" : "linear-gradient(90deg,#6F4BFF,#7B61FF)",
          transition: "width 0.5s linear",
        }} />
      </div>

      {/* ── PRICE PANEL ── */}
      <div className="grid grid-cols-2" style={{ borderBottom: "1px solid var(--border-card)" }}>

        {/* Current price */}
        <div className="px-4 py-4" style={{ borderRight: "1px solid var(--border-card)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
            style={{ color: "var(--text-muted)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: wsConnected ? "#5ED3A6" : "#756D8F", boxShadow: wsConnected ? "0 0 5px #5ED3A6" : "none" }} />
            ราคาปัจจุบัน
          </div>
          <div className="text-2xl font-black leading-none" style={{ letterSpacing: "-0.02em" }}>
            <PriceTicker value={price} prefix="$" />
          </div>
          {priceDiff !== null && lockPrice !== null && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
              style={{
                background: priceDiff >= 0 ? "rgba(94,211,166,0.1)" : "rgba(217,107,107,0.1)",
                color: priceDiff >= 0 ? "#5ED3A6" : "#D96B6B",
              }}>
              {priceDiff >= 0 ? "▲" : "▼"} ${Math.abs(priceDiff).toFixed(2)}
            </div>
          )}
        </div>

        {/* Lock price */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--text-muted)" }}>
            🎯 ราคาล็อค (Target)
          </div>
          <div className="text-2xl font-black leading-none" style={{ color: "#D7B56D", letterSpacing: "-0.02em", opacity: lockPrice ? 1 : 0.4 }}>
            {lockPrice ? `$${fmtPrice(lockPrice)}` : "รอราคา..."}
          </div>
          {myChoice && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
              style={{
                background: myChoice === "up" ? "rgba(94,211,166,0.1)" : "rgba(217,107,107,0.1)",
                color: myChoice === "up" ? "#5ED3A6" : "#D96B6B",
              }}>
              {myChoice === "up" ? "ต้องสูงกว่านี้" : "ต้องต่ำกว่านี้"}
            </div>
          )}
          {!myChoice && lockPrice && (
            <div className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>ราคาตอนเปิดรอบ</div>
          )}
        </div>
      </div>

      {/* ── WIN/LOSE BAR ── (shows only after betting) */}
      {myChoice && priceDiff !== null && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-card)", background: "rgba(0,0,0,0.15)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold" style={{ color: isWinning ? "#5ED3A6" : "#D96B6B" }}>
              {isWinning ? "🏆 กำลังชนะ!" : "💀 กำลังแพ้"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {myChoice === "up" ? `ต้องให้ราคา > $${fmtPrice(lockPrice!)}` : `ต้องให้ราคา < $${fmtPrice(lockPrice!)}`}
            </span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-panel)" }}>
            {/* Center marker */}
            <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: "50%", background: "#D7B56D" }} />
            {/* Moving bar */}
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              width: `${Math.min(Math.abs(priceDiff) / (pad || 1) * 50, 50)}%`,
              left: myChoice === "up" ? "50%" : `${Math.max(50 - Math.min(Math.abs(priceDiff) / (pad || 1) * 50, 50), 0)}%`,
              background: isWinning ? "#5ED3A6" : "#D96B6B",
              borderRadius: 4,
              transition: "width 0.5s ease, left 0.5s ease",
            }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
            <span>ราคาล็อค</span>
            <span>ห่าง ${Math.abs(priceDiff).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── CHART ── */}
      <div className="pt-3 pb-1">
        {pricePoints.length < 2 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12" style={{ color: "var(--text-muted)" }}>
            <div className="text-3xl" style={{ animation: "pulse 2s ease-in-out infinite" }}>📡</div>
            <div className="text-sm">กำลังรับข้อมูลราคา...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={pricePoints} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="t" type="number" scale="time"
                domain={[roundStart, roundEnd]} tickCount={4}
                tickFormatter={v => new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[minP - pad, maxP + pad]} orientation="right" width={72}
                tickFormatter={v => `$${Math.round(v as number).toLocaleString()}`}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
              {lockPrice && (
                <>
                  <ReferenceArea y1={lockPrice} y2={maxP + pad}
                    fill="rgba(94,211,166,0.07)" stroke="none"
                    label={{ value: "▲ UP ชนะ", position: "insideTopRight", fill: "rgba(94,211,166,0.55)", fontSize: 10, fontWeight: 700 }} />
                  <ReferenceArea y1={minP - pad} y2={lockPrice}
                    fill="rgba(217,107,107,0.07)" stroke="none"
                    label={{ value: "▼ DOWN ชนะ", position: "insideBottomRight", fill: "rgba(217,107,107,0.55)", fontSize: 10, fontWeight: 700 }} />
                  <ReferenceLine y={lockPrice} stroke="rgba(215,181,109,0.6)" strokeDasharray="5 3"
                    label={<TargetLabel myChoice={myChoice} />} />
                </>
              )}
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="price" stroke="#6085F5" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: "#6085F5", strokeWidth: 0 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex justify-between px-4 text-[10px] pb-2" style={{ color: "var(--text-muted)" }}>
          <span>{new Date(roundStart).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>{new Date(roundEnd).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* ── POOL BAR ── */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-card)" }}>
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span style={{ color: "#5ED3A6" }}>▲ UP {upPct}%</span>
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
            {hasPool ? `${upPool.toLocaleString()} vs ${downPool.toLocaleString()} ญาณ` : "รอผู้เล่นคนแรก"}
          </span>
          <span style={{ color: "#D96B6B" }}>DOWN {downPct}% ▼</span>
        </div>
        <div className="flex rounded-full overflow-hidden" style={{ height: 6, background: "var(--bg-panel)" }}>
          <div style={{ width: `${upPct}%`, background: "linear-gradient(90deg,#2d9e6b,#5ED3A6)", transition: "width 0.8s ease" }} />
          <div style={{ flex: 1, background: "linear-gradient(90deg,#D96B6B,#a84040)" }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
          {hasPool ? (
            <>
              <span>ชนะได้ ≈ {upPool > 0 ? (totalPool / upPool * 0.95).toFixed(2) : "1.90"}x</span>
              <span>ชนะได้ ≈ {downPool > 0 ? (totalPool / downPool * 0.95).toFixed(2) : "1.90"}x</span>
            </>
          ) : (
            <span className="w-full text-center">ทายคนแรก — ได้ราคาดีที่สุด!</span>
          )}
        </div>
      </div>

      {/* ── BET SECTION ── */}
      <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-card)" }}>

        {/* Error */}
        {betError && (
          <div className="mt-3 px-3 py-2 rounded-xl text-sm font-semibold text-center"
            style={{ background: "rgba(217,107,107,0.1)", border: "1px solid rgba(217,107,107,0.25)", color: "#D96B6B" }}>
            {betError}
          </div>
        )}

        {/* Already bet → show summary */}
        {myChoice ? (
          <div className="mt-3 px-4 py-4 rounded-2xl" style={{
            background: "linear-gradient(135deg, rgba(111,75,255,0.08), rgba(111,75,255,0.03))",
            border: "1px solid rgba(111,75,255,0.2)",
          }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>คุณทาย</div>
                <div className="text-xl font-black" style={{ color: myChoice === "up" ? "#5ED3A6" : "#D96B6B" }}>
                  {myChoice === "up" ? "▲ UP" : "▼ DOWN"}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  วางเดิมพัน <span style={{ color: "#D7B56D", fontWeight: 700 }}>{myBet?.amount ?? betAmt} ญาณ</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>ถ้าชนะได้รับ</div>
                <div className="text-xl font-black" style={{ color: "#D7B56D" }}>
                  ~{estPayout.toFixed(0)} ญาณ
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  กำไร +{(estPayout - (myBet?.amount ?? betAmt)).toFixed(0)} ญาณ
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 text-xs text-center" style={{ borderTop: "1px solid rgba(111,75,255,0.15)", color: "var(--text-muted)" }}>
              ประกาศผล {new Date(roundEnd).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </div>
          </div>
        ) : locked ? (
          /* Locked */
          <div className="mt-3 py-5 rounded-2xl text-center" style={{
            background: "rgba(75,57,117,0.15)", border: "1px solid rgba(75,57,117,0.3)",
          }}>
            <div className="text-2xl mb-1">🔒</div>
            <div className="font-bold text-sm" style={{ color: "#756D8F" }}>ปิดรับการทายแล้ว</div>
            <div className="text-xs mt-1" style={{ color: "#756D8F" }}>รอบถัดไปใน {fmtCountdown(timeLeft)}</div>
          </div>
        ) : (
          /* Bet form */
          <>
            {/* Amount picker */}
            <div className="mt-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>จำนวน ญาณ ที่ทาย</span>
                {myCoins !== null && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    มี <span style={{ color: "#D7B56D", fontWeight: 700 }}>{myCoins.toLocaleString()}</span> ญาณ
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
                        boxShadow: betAmt === amt ? "0 0 12px rgba(111,75,255,0.35)" : "none",
                        opacity: tooMuch ? 0.4 : 1,
                      }}>
                      {amt}
                    </button>
                  );
                })}
              </div>
              <div className="text-right text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                ถ้าชนะได้รับ ≈ <span style={{ color: "#D7B56D", fontWeight: 700 }}>{estPayout.toFixed(0)} ญาณ</span>
                {" "}(+{(estPayout - betAmt).toFixed(0)})
              </div>
            </div>

            {/* UP / DOWN buttons */}
            <div className="grid grid-cols-2 gap-3">
              {(["up", "down"] as const).map(dir => {
                const isUp = dir === "up";
                return (
                  <button key={dir} onClick={() => handleBet(dir)}
                    disabled={betLoading || !round}
                    className="group relative flex flex-col items-center justify-center gap-0.5 rounded-xl overflow-hidden transition-all active:scale-[0.97]"
                    style={{
                      height: 72,
                      background: isUp
                        ? "linear-gradient(160deg, #0fa968 0%, #0d8f57 100%)"
                        : "linear-gradient(160deg, #c0392b 0%, #962d22 100%)",
                      boxShadow: isUp
                        ? "0 4px 20px rgba(15,169,104,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
                        : "0 4px 20px rgba(192,57,43,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
                      border: "none",
                      cursor: betLoading || !round ? "wait" : "pointer",
                      opacity: betLoading || !round ? 0.7 : 1,
                    }}>
                    {/* shine strip */}
                    <div className="absolute inset-x-0 top-0 h-px opacity-40"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)" }} />
                    {/* hover overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: "rgba(255,255,255,0.06)" }} />

                    <div className="flex items-center gap-2 z-10">
                      <span className="text-white font-black text-xl tracking-wide">
                        {isUp ? "▲" : "▼"}
                      </span>
                      <span className="text-white font-black text-xl tracking-widest">
                        {isUp ? "BUY / UP" : "SELL / DOWN"}
                      </span>
                    </div>
                    <div className="z-10 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em" }}>
                      {isUp ? upPct : downPct}% เชื่อ • กำไร ≈ {isUp
                        ? (upPool > 0 ? (totalPool / upPool * 0.95).toFixed(2) : "1.90")
                        : (downPool > 0 ? (totalPool / downPool * 0.95).toFixed(2) : "1.90")}x
                    </div>
                    {betLoading && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.35)" }}>
                        <span className="text-white text-xs font-bold">กำลังบันทึก...</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-center text-[10px] mt-2" style={{ color: "rgba(117,109,143,0.5)" }}>
              กดเพื่อทาย • ตัดเงินทันที • ผลประกาศอัตโนมัติหลังปิดรอบ
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER STATS ── */}
      <div className="grid grid-cols-3 text-center py-2.5" style={{
        borderTop: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)",
      }}>
        {[
          { label: "Pool รวม", value: `${totalPool.toLocaleString()} ญาณ` },
          { label: "เปิดรอบ", value: new Date(roundStart).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) },
          { label: "ปิดรอบ", value: new Date(roundEnd).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) },
        ].map((s, i) => (
          <div key={i} style={{ borderRight: i < 2 ? "1px solid var(--border-card)" : "none" }}>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
