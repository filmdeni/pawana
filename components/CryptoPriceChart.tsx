"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  date: string;
  price: number;
  live?: boolean;
}

interface Props {
  symbol: string;
  coinName: string;
  data: PricePoint[]; // 30d historical from server (CoinGecko)
}

type TF = "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1M";

const TIMEFRAMES: { label: string; value: TF }[] = [
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1M", value: "1M" },
];

// Binance interval + how many candles
const TF_CONFIG: Record<TF, { interval: string; limit: number } | null> = {
  "5m":  { interval: "5m",  limit: 120 },
  "15m": { interval: "15m", limit: 96  },
  "30m": { interval: "30m", limit: 96  },
  "1h":  { interval: "1h",  limit: 168 },
  "4h":  { interval: "4h",  limit: 180 },
  "1d":  { interval: "1d",  limit: 90  },
  "1M":  null, // use server CoinGecko data
};

function fmtDate(ts: number, tf: TF): string {
  const d = new Date(ts);
  if (tf === "5m" || tf === "15m" || tf === "30m") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (tf === "1h" || tf === "4h") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt(price: number) {
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toBinanceSymbol(symbol: string) {
  return `${symbol.toUpperCase()}USDT`;
}
function toStreamName(symbol: string) {
  return `${symbol.toLowerCase()}usdt@aggTrade`;
}

async function fetchKlines(symbol: string, tf: TF): Promise<PricePoint[]> {
  const cfg = TF_CONFIG[tf];
  if (!cfg) return [];
  const url = `https://api.binance.com/api/v3/klines?symbol=${toBinanceSymbol(symbol)}&interval=${cfg.interval}&limit=${cfg.limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const rows = await res.json() as [number, string, string, string, string, ...unknown[]][];
  return rows.map((r) => ({
    date: fmtDate(r[0], tf),
    price: parseFloat(r[4]), // close price
  }));
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: PricePoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      <p className="font-bold text-white">${fmt(payload[0].value)}</p>
      {payload[0].payload.live && <p className="text-green-400 text-[10px] mt-0.5">● LIVE</p>}
    </div>
  );
}

export default function CryptoPriceChart({ symbol, coinName, data: initialData }: Props) {
  const [tf, setTf] = useState<TF>("1M");
  const [baseData, setBaseData] = useState<PricePoint[]>(initialData);
  const [chartData, setChartData] = useState<PricePoint[]>(initialData);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const lastTickRef = useRef<number>(0);
  const livePriceRef = useRef<number | null>(null);
  const tfRef = useRef<TF>("1M");
  const baseDataRef = useRef<PricePoint[]>(initialData);

  // keep refs in sync so intervals can read latest values
  useEffect(() => { tfRef.current = tf; }, [tf]);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);
  useEffect(() => { baseDataRef.current = baseData; }, [baseData]);

  // fetch klines when timeframe changes
  const loadTf = useCallback(async (newTf: TF) => {
    if (newTf === "1M") {
      setBaseData(initialData);
      setChartData(initialData);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchKlines(symbol, newTf);
      setBaseData(data);
      setChartData(data);
    } finally {
      setLoading(false);
    }
  }, [symbol, initialData]);

  const handleTf = (newTf: TF) => {
    setTf(newTf);
    loadTf(newTf);
  };

  // Binance WebSocket for live price
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${toStreamName(symbol)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as { p: string };
        const price = parseFloat(msg.p);
        if (!isFinite(price)) return;
        setLivePrice(price);
        livePriceRef.current = price;

        // throttle chart update to 1s — just update last point for header price
        const now = Date.now();
        if (now - lastTickRef.current < 1000) return;
        lastTickRef.current = now;
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [symbol]);

  // Append live point every 3 seconds — makes chart scroll rightward
  useEffect(() => {
    const SHORT_TFS: TF[] = ["5m", "15m", "30m", "1h"];
    const INTERVAL_MS = 3000;
    const MAX_LIVE = 60; // max extra live points to keep

    const timer = setInterval(() => {
      const price = livePriceRef.current;
      if (!price) return;

      const currentTf = tfRef.current;
      const isShort = SHORT_TFS.includes(currentTf);

      setChartData((prev) => {
        if (isShort) {
          // append new point — chart scrolls
          const d = new Date();
          const label = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          const base = baseDataRef.current;
          const livePoints = prev.slice(base.length);
          const trimmed = livePoints.slice(-MAX_LIVE);
          return [...base, ...trimmed, { date: label, price, live: true }];
        } else {
          // just update last point for context
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], price, live: true };
          return updated;
        }
      });
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const first = baseData[0]?.price || 1;
  const last = livePrice ?? chartData[chartData.length - 1]?.price ?? first;
  const change = last - first;
  const changePct = ((change / first) * 100).toFixed(2);
  const isUp = change >= 0;
  const color = isUp ? "#f97316" : "#ef4444";

  // domain anchored to baseData so Y-axis doesn't jump on every live tick
  const basePrices = baseData.map((d) => d.price);
  const minPrice = Math.min(...basePrices);
  const maxPrice = Math.max(...basePrices);
  const padding = (maxPrice - minPrice) * 0.08 || 1;

  const tfLabel = tf === "1M" ? "30 วัน" : tf;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              ราคา {coinName} ({symbol})
            </p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${connected ? "bg-green-500/20 text-green-400" : "bg-zinc-700/40 text-zinc-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-zinc-500"}`} />
              {connected ? "LIVE" : "กำลังเชื่อมต่อ..."}
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-1 tabular-nums">${fmt(last)}</p>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${isUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {isUp ? "+" : ""}{changePct}% ({tfLabel})
        </span>
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-1">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTf(t.value)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              tf === t.value
                ? "bg-orange-500/30 text-orange-300 border border-orange-500/50"
                : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`transition-opacity ${loading ? "opacity-40" : "opacity-100"}`}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v as number).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              width={68}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill="url(#cryptoGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between">
        {livePrice && (
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ background: color }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
            </span>
            ราคาสด ${fmt(livePrice)}
          </span>
        )}
        <p className="text-[10px] text-[var(--text-muted)] ml-auto">
          CoinGecko · Binance
        </p>
      </div>
    </div>
  );
}
