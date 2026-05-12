"use client";
import { useRef, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";

interface Props {
  src: string;
  position: string;
  height?: number;
  onChange: (pos: string) => void;
  onReplace: () => void;
  onRemove: () => void;
}

export default function ImagePositionPicker({
  src, position, height = 140, onChange, onReplace, onRemove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [px, py] = position.split(" ").map(v => parseFloat(v) || 50);

  function posFromEvent(e: React.MouseEvent | MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    onChange(`${x}% ${y}%`);
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) { if (dragging.current) posFromEvent(e); }
    function onMouseUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onChange]);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden select-none"
        style={{ height, cursor: "crosshair", border: "1px solid rgba(255,255,255,0.1)" }}
        onMouseDown={e => { dragging.current = true; posFromEvent(e); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: position }} />

        {/* crosshair */}
        <div className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${px}%`, top: `${py}%` }}>
          <div className="absolute inset-0 rounded-full border-2 border-white"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.5)" }} />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white opacity-70" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-white opacity-70" />
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold pointer-events-none"
          style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}>
          ลากเพื่อจัดตำแหน่ง
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] font-mono flex-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          {px}% {py}%
        </span>
        <button type="button" onClick={() => onChange("50% 50%")}
          className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors hover:bg-white/5"
          style={{ color: "rgba(167,139,250,0.7)" }}>
          reset
        </button>
        <button type="button" onClick={onReplace}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors"
          style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
          <ImagePlus className="w-3 h-3" /> เปลี่ยนรูป
        </button>
        <button type="button" onClick={onRemove}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors"
          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
          <X className="w-3 h-3" /> ลบ
        </button>
      </div>
    </div>
  );
}
