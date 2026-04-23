"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ScratchRevealHandle = {
  reveal: () => void;
};

type ScratchRevealProps = {
  children: ReactNode;
  className?: string;
  overlayLabel?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const ScratchReveal = forwardRef<ScratchRevealHandle, ScratchRevealProps>(
  function ScratchReveal(
    { children, className = "", overlayLabel = "Scratch to reveal" },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const drawing = useRef(false);
    const [revealed, setRevealed] = useState(false);

    const overlayGradient = useMemo(() => {
      // Fully obscuring “scratch card” surface (must hide underlying content),
      // with a subtle violet hint so it reads as an intentional scratchpad.
      return [
        "rgba(14,10,20,0.985)",
        "rgba(10,10,12,0.985)",
        "rgba(20,12,28,0.985)",
      ];
    }, []);

    const paintOverlay = useCallback(() => {
      const c = canvasRef.current;
      const root = rootRef.current;
      if (!c || !root) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const rect = root.getBoundingClientRect();

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, rect.width, rect.height);

      const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      g.addColorStop(0, overlayGradient[0]!);
      g.addColorStop(0.55, overlayGradient[1]!);
      g.addColorStop(1, overlayGradient[2]!);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // A soft violet bloom so the overlay separates from the page background.
      const rg = ctx.createRadialGradient(
        rect.width * 0.6,
        rect.height * 0.35,
        0,
        rect.width * 0.6,
        rect.height * 0.35,
        Math.max(rect.width, rect.height) * 0.75,
      );
      rg.addColorStop(0, "rgba(168, 85, 247, 0.14)");
      rg.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Add a stronger scratch texture without importing assets.
      ctx.globalAlpha = 0.14;
      for (let i = 0; i < 320; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const r = 0.4 + Math.random() * 1.8;
        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // A few soft streaks.
      ctx.globalAlpha = 0.10;
      for (let i = 0; i < 18; i++) {
        const x1 = Math.random() * rect.width;
        const y1 = Math.random() * rect.height;
        const x2 = x1 + (Math.random() * 180 - 90);
        const y2 = y1 + (Math.random() * 120 - 60);
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 10 + Math.random() * 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, [overlayGradient]);

    const sizeCanvas = useCallback(() => {
      const c = canvasRef.current;
      const root = rootRef.current;
      if (!c || !root) return;
      const rect = root.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      c.width = Math.max(1, Math.floor(rect.width * dpr));
      c.height = Math.max(1, Math.floor(rect.height * dpr));
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintOverlay();
    }, [paintOverlay]);

    const eraseAt = useCallback((clientX: number, clientY: number) => {
      const c = canvasRef.current;
      const root = rootRef.current;
      if (!c || !root) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const rect = root.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      // Larger brush so the interaction is quick and fun.
      const radius = Math.max(40, Math.min(rect.width, rect.height) * 0.12);

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }, []);

    const clearedRatio = useCallback((): number => {
      const c = canvasRef.current;
      const root = rootRef.current;
      if (!c || !root) return 0;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return 0;

      const rect = root.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      // Downsample: sample every N pixels so it’s fast.
      const step = Math.max(10, Math.floor(Math.min(w, h) / 28));

      let total = 0;
      let cleared = 0;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          total++;
          const a = ctx.getImageData(x, y, 1, 1).data[3];
          // Alpha near 0 means erased.
          if (a < 16) cleared++;
        }
      }
      return total ? cleared / total : 0;
    }, []);

    const reveal = useCallback(() => {
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
      setRevealed(true);
    }, []);

    const maybeAutoReveal = useCallback(() => {
      if (revealed) return;
      // If user cleared most of it, snap to revealed and show the glow.
      const ratio = clearedRatio();
      if (ratio >= 0.55) reveal();
    }, [clearedRatio, reveal, revealed]);

    useImperativeHandle(ref, () => ({ reveal }), [reveal]);

    useEffect(() => {
      if (revealed) return;
      sizeCanvas();
      const ro = new ResizeObserver(() => sizeCanvas());
      if (rootRef.current) ro.observe(rootRef.current);
      return () => ro.disconnect();
    }, [revealed, sizeCanvas]);

    useEffect(() => {
      if (!revealed) return;
      // If revealed, ensure overlay is empty.
      reveal();
    }, [revealed, reveal]);

    return (
      <div
        ref={rootRef}
        className={`relative ${className} ${
          revealed
            ? "shadow-[0_0_0_1px_rgba(168,85,247,0.16),0_28px_84px_-44px_rgba(168,85,247,0.35)] ring-1 ring-white/[0.06]"
            : ""
        }`.trim()}
        aria-label={overlayLabel}
      >
        {children}

        {!revealed ? (
          <>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 rounded-[inherit] touch-none"
              onPointerDown={(e) => {
                drawing.current = true;
                (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                eraseAt(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                eraseAt(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                drawing.current = false;
                maybeAutoReveal();
              }}
              onPointerCancel={() => {
                drawing.current = false;
              }}
            />

            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
              <div className="rounded-full border border-white/[0.14] bg-black/35 px-4 py-2 text-[12px] font-semibold text-white/90 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]">
                Scratch to reveal
              </div>
            </div>

            <button
              type="button"
              onClick={reveal}
              className="bf-btn-secondary-bar absolute right-3 top-3 z-30 min-h-9 px-3 text-[12px]"
            >
              Reveal
            </button>
          </>
        ) : null}
      </div>
    );
  },
);

