"use client";
import { useEffect, useRef } from "react";

interface Coin {
  id: number;
  startX: number;
  startY: number;
}

let listeners: ((coins: Coin[]) => void)[] = [];
let _coinId = 0;

export function triggerCoinFly(sourceEl: HTMLElement, count = 6) {
  const rect = sourceEl.getBoundingClientRect();
  const wallet = document.getElementById("wallet-coin-target");
  if (!wallet) return;

  const coins: Coin[] = Array.from({ length: count }, () => ({
    id: _coinId++,
    startX: rect.left + rect.width / 2,
    startY: rect.top + rect.height / 2,
  }));
  listeners.forEach((fn) => fn(coins));
}

export default function CoinFlyLayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (coins: Coin[]) => {
      const wallet = document.getElementById("wallet-coin-target");
      if (!wallet || !containerRef.current) return;
      const targetRect = wallet.getBoundingClientRect();
      const tx = targetRect.left + targetRect.width / 2;
      const ty = targetRect.top + targetRect.height / 2;

      coins.forEach((coin, i) => {
        const el = document.createElement("img");
        el.src = "/images/point2.png";
        el.width = 20;
        el.height = 20;
        el.style.cssText = `
          position: fixed;
          left: ${coin.startX}px;
          top: ${coin.startY}px;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: none;
        `;
        document.body.appendChild(el);

        // Stagger each coin slightly
        setTimeout(() => {
          el.style.transition = `left 0.6s cubic-bezier(0.4,0,0.2,1), top 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease 0.5s, transform 0.6s ease`;
          el.style.left = `${tx}px`;
          el.style.top = `${ty}px`;
          el.style.transform = "translate(-50%, -50%) scale(0.3)";
          el.style.opacity = "0";

          setTimeout(() => {
            el.remove();
            // Flash the wallet
            const w = document.getElementById("wallet-coin-target");
            if (w) {
              w.classList.add("coin-arrived");
              setTimeout(() => w.classList.remove("coin-arrived"), 400);
            }
          }, 700);
        }, i * 60);
      });
    };

    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);

  return <div ref={containerRef} />;
}
