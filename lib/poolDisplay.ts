/** Clamp yes% to 5–95 so neither side ever shows 0% or 100% visually */
export function clampPct(yesPct: number): { yes: number; no: number } {
  const yes = Math.min(95, Math.max(5, yesPct));
  return { yes, no: 100 - yes };
}
