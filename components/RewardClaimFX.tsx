"use client";
import { useEffect, useRef } from "react";

interface ClaimEvent {
  sourceEl: HTMLElement;
  reward: number;
  label?: string;
}

let listeners: ((e: ClaimEvent) => void)[] = [];

export function triggerRewardClaim(
  sourceEl: HTMLElement,
  reward: number,
  label?: string
) {
  listeners.forEach((fn) => fn({ sourceEl, reward, label }));
}

// Inject a single-use keyframe animation for orb arc
function injectArcStyle(id: string, cx: number, cy: number, tx: number, ty: number) {
  const arcMidX = cx + (tx - cx) * 0.35 + (ty > cy ? -55 : 55);
  const arcMidY = Math.min(cy, ty) - 90;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes ${id} {
      0%   { left:${cx}px; top:${cy}px; transform:translate(-50%,-50%) scale(1); opacity:1; }
      38%  { left:${arcMidX}px; top:${arcMidY}px; transform:translate(-50%,-50%) scale(0.72); opacity:1; }
      100% { left:${tx}px; top:${ty}px; transform:translate(-50%,-50%) scale(0.18); opacity:0; }
    }
  `;
  document.head.appendChild(style);
  return { arcMidX, arcMidY, style };
}

export default function RewardClaimFX() {
  const _ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = ({ sourceEl, reward, label }: ClaimEvent) => {
      const rect   = sourceEl.getBoundingClientRect();
      const wallet = document.getElementById("wallet-coin-target");
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;

      // ── 1. Screen shake ──────────────────────────────────────────
      document.body.classList.add("rcfx-shake");
      setTimeout(() => document.body.classList.remove("rcfx-shake"), 320);

      // ── 2. Card border flash ─────────────────────────────────────
      const card = sourceEl.closest("[data-mission-card]") as HTMLElement | null;
      if (card) {
        card.classList.add("rcfx-card-flash");
        setTimeout(() => card.classList.remove("rcfx-card-flash"), 700);
      }

      // ── 3. Impact wave rings (3 staggered) ───────────────────────
      const waveColors = [
        ["rgba(215,181,109,0.9)", "rgba(215,181,109,0.4)"],
        ["rgba(111,75,255,0.75)", "rgba(111,75,255,0.3)"],
        ["rgba(255,224,138,0.6)", "rgba(255,224,138,0.2)"],
      ];
      waveColors.forEach(([border, glow], i) => {
        const wave = document.createElement("div");
        wave.className = "rcfx-wave";
        wave.style.cssText = `
          position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;z-index:9997;
          border-color:${border};box-shadow:0 0 14px ${glow};
          animation-delay:${i * 75}ms;animation-duration:${0.45 + i * 0.08}s;
        `;
        document.body.appendChild(wave);
        setTimeout(() => wave.remove(), 600 + i * 100);
      });

      // ── 4. Burst particles ───────────────────────────────────────
      const palette = [
        "#FFE08A","#D7B56D","#F4C24A","#7B61FF","#B89FFF",
        "#D480FF","#FFFFFF","#FFC86E","#9B7FFF","#FFD9A0",
      ];
      for (let i = 0; i < 22; i++) {
        const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist  = 28 + Math.random() * 46;
        const size  = 2 + Math.random() * 4.5;
        const color = palette[i % palette.length];
        const delay = i * 8;
        const dur   = 0.34 + Math.random() * 0.22;

        const p = document.createElement("div");
        // diamond shape for every 4th particle
        const isDiamond = i % 4 === 0;
        p.style.cssText = `
          position:fixed;left:${cx}px;top:${cy}px;
          width:${size}px;height:${size}px;
          ${isDiamond ? "border-radius:1px;transform:translate(-50%,-50%) rotate(45deg);" : "border-radius:50%;transform:translate(-50%,-50%);"}
          background:${color};
          box-shadow:0 0 ${size * 2.8}px ${color};
          pointer-events:none;z-index:9998;
          transition:none;
        `;
        document.body.appendChild(p);
        setTimeout(() => {
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          p.style.transition = `transform ${dur}s cubic-bezier(0,0.85,0.5,1), opacity 0.22s ease ${dur * 0.55}s`;
          p.style.transform  = isDiamond
            ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(45deg) scale(0)`
            : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
          p.style.opacity = "0";
        }, delay + 10);
        setTimeout(() => p.remove(), delay + 700);
      }

      // Micro dust cloud — tiny 1px dots
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = 12 + Math.random() * 38;
        const dust  = document.createElement("div");
        dust.style.cssText = `
          position:fixed;left:${cx}px;top:${cy}px;
          width:1.5px;height:1.5px;border-radius:50%;
          background:rgba(255,224,138,0.7);
          transform:translate(-50%,-50%);
          pointer-events:none;z-index:9997;
        `;
        document.body.appendChild(dust);
        setTimeout(() => {
          dust.style.transition = `transform 0.5s cubic-bezier(0,0.6,0.4,1) ${i * 6}ms, opacity 0.3s ease ${0.25 + i * 0.006}s`;
          dust.style.transform  = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`;
          dust.style.opacity    = "0";
        }, 15);
        setTimeout(() => dust.remove(), 700);
      }

      // Light streaks / shards
      for (let i = 0; i < 7; i++) {
        const angle  = (i / 7) * Math.PI * 2;
        const length = 10 + Math.random() * 10;
        const shard  = document.createElement("div");
        const isGold = i % 2 === 0;
        shard.style.cssText = `
          position:fixed;left:${cx}px;top:${cy}px;
          width:1.5px;height:${length}px;border-radius:1px;
          background:linear-gradient(to bottom,${isGold ? "rgba(255,224,138,0.95)" : "rgba(180,140,255,0.85)"},rgba(0,0,0,0));
          transform:translate(-50%,-50%) rotate(${(angle*180)/Math.PI}deg) scaleY(0);
          pointer-events:none;z-index:9998;
          transition:transform 0.26s cubic-bezier(0.34,1.56,0.64,1) ${i*16}ms, opacity 0.18s ease ${0.20+i*0.016}s;
        `;
        document.body.appendChild(shard);
        setTimeout(() => {
          shard.style.transform = `translate(-50%,-50%) rotate(${(angle*180)/Math.PI}deg) scaleY(1) translateY(-${length/2}px)`;
          shard.style.opacity   = "0";
        }, 20 + i * 16);
        setTimeout(() => shard.remove(), 550);
      }

      // ── 5. Rune ring ─────────────────────────────────────────────
      const rune = document.createElement("div");
      rune.className = "rcfx-rune";
      rune.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;z-index:9997;`;
      rune.innerHTML = `
        <div class="rcfx-rune-inner"></div>
        <div class="rcfx-rune-dots"></div>
      `;
      document.body.appendChild(rune);
      setTimeout(() => rune.remove(), 1200);

      // ── 6. Glowing orb ───────────────────────────────────────────
      const orb = document.createElement("div");
      orb.className = "rcfx-orb";
      orb.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;z-index:10000;transform:translate(-50%,-50%) scale(0);`;
      // inner glint highlight
      orb.innerHTML = `<div class="rcfx-orb-glint"></div>`;
      document.body.appendChild(orb);

      setTimeout(() => {
        orb.style.transition = "transform 0.28s cubic-bezier(0.34,1.7,0.64,1)";
        orb.style.transform  = "translate(-50%,-50%) scale(1)";
      }, 18);

      // ── 7. Floating reward text ───────────────────────────────────
      const txt = document.createElement("div");
      txt.className = "rcfx-text";
      txt.style.cssText = `position:fixed;left:${cx}px;top:${cy - 6}px;pointer-events:none;z-index:10001;transform:translate(-50%,-50%) scale(0);opacity:1;`;
      txt.innerHTML = `
        <div class="rcfx-text-amount">+${reward} XP</div>
        <div class="rcfx-text-label">${label ?? `ได้รับ ${reward} ญาณ`}</div>
      `;
      document.body.appendChild(txt);

      setTimeout(() => {
        txt.style.transition = "transform 0.38s cubic-bezier(0.34,1.56,0.64,1)";
        txt.style.transform  = "translate(-50%,-50%) scale(1)";
      }, 150);
      setTimeout(() => {
        txt.style.transition = "top 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease 0.52s";
        txt.style.top        = `${cy - 85}px`;
        txt.style.opacity    = "0";
      }, 310);
      setTimeout(() => txt.remove(), 1300);

      // ── 8. Orb flies to wallet (curved arc) ──────────────────────
      if (!wallet) {
        setTimeout(() => orb.remove(), 950);
        return;
      }

      setTimeout(() => {
        const tRect  = wallet.getBoundingClientRect();
        const tx     = tRect.left + tRect.width  / 2;
        const ty     = tRect.top  + tRect.height / 2;

        const arcId = `rcfx-arc-${Date.now()}`;
        const { style: arcStyle } = injectArcStyle(arcId, cx, cy, tx, ty);

        orb.style.transition = "none";
        orb.style.animation  = `${arcId} 0.56s cubic-bezier(0.4,0,0.3,1) forwards`;

        // Trail particles — poll orb bounding rect
        let trailActive = true;
        const trailTick = setInterval(() => {
          if (!trailActive || !document.body.contains(orb)) {
            clearInterval(trailTick);
            return;
          }
          const r     = orb.getBoundingClientRect();
          const tlx   = r.left + r.width  / 2;
          const tly   = r.top  + r.height / 2;
          const isVio = Math.random() > 0.5;
          const trail = document.createElement("div");
          trail.style.cssText = `
            position:fixed;left:${tlx}px;top:${tly}px;
            width:8px;height:8px;border-radius:50%;
            background:${isVio ? "rgba(111,75,255,0.7)" : "rgba(215,181,109,0.7)"};
            box-shadow:0 0 10px ${isVio ? "rgba(111,75,255,0.5)" : "rgba(215,181,109,0.5)"};
            transform:translate(-50%,-50%) scale(1);
            pointer-events:none;z-index:9999;
          `;
          document.body.appendChild(trail);
          setTimeout(() => {
            trail.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            trail.style.transform  = "translate(-50%,-50%) scale(0)";
            trail.style.opacity    = "0";
          }, 10);
          setTimeout(() => trail.remove(), 320);
        }, 28);

        setTimeout(() => {
          trailActive = false;
          clearInterval(trailTick);
          orb.remove();
          arcStyle.remove();

          // Wallet flash burst
          const flash = document.createElement("div");
          flash.className = "rcfx-wallet-flash";
          flash.style.cssText = `
            position:fixed;left:${tx}px;top:${ty}px;
            pointer-events:none;z-index:10002;
          `;
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 500);

          // Mini impact particles at wallet
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const mp = document.createElement("div");
            mp.style.cssText = `
              position:fixed;left:${tx}px;top:${ty}px;
              width:4px;height:4px;border-radius:50%;
              background:#FFE08A;
              box-shadow:0 0 8px rgba(215,181,109,0.8);
              transform:translate(-50%,-50%);
              pointer-events:none;z-index:10001;
            `;
            document.body.appendChild(mp);
            setTimeout(() => {
              mp.style.transition = "transform 0.25s cubic-bezier(0,0.8,0.4,1), opacity 0.18s ease 0.1s";
              mp.style.transform  = `translate(calc(-50% + ${Math.cos(a)*18}px), calc(-50% + ${Math.sin(a)*18}px)) scale(0)`;
              mp.style.opacity    = "0";
            }, 10);
            setTimeout(() => mp.remove(), 400);
          }

          // Wallet impact + linger
          wallet.classList.add("rcfx-wallet-hit");
          setTimeout(() => wallet.classList.remove("rcfx-wallet-hit"), 520);
          wallet.classList.add("rcfx-wallet-glow");
          setTimeout(() => wallet.classList.remove("rcfx-wallet-glow"), 1100);

          wallet.classList.add("coin-arrived");
          setTimeout(() => wallet.classList.remove("coin-arrived"), 400);
        }, 590);
      }, 480);
    };

    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  return <div ref={_ref} />;
}
