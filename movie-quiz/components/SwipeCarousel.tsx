"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: React.ReactNode;
  subtitle?: string;
  hint?: string;
  children: React.ReactNode;
};

export function SwipeCarousel({ title, subtitle, hint, children }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => {
    return Array.isArray(children) ? children : [children];
  }, [children]);
  const drag = useRef<{
    on: boolean;
    startX: number;
    startScrollLeft: number;
    pointerId: number | null;
  }>({ on: false, startX: 0, startScrollLeft: 0, pointerId: null });

  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const raf = useRef<number | null>(null);
  const itemsLen = items.length;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const initialIdx = Math.min(2, Math.max(0, itemsLen - 1));
    activeIdxRef.current = initialIdx;
    setActiveIdx(initialIdx);
    // Ensure the initial card is centered after layout.
    el.scrollLeft = 0;

    const computeActive = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      const nodes = Array.from(scroller.querySelectorAll<HTMLElement>("[data-carousel-item]"));
      if (!nodes.length) return;
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const nCenter = n.offsetLeft + n.offsetWidth / 2;
        const dist = Math.abs(nCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      // Hysteresis to prevent flicker near the midpoint between cards.
      const w = nodes[bestIdx]?.offsetWidth ?? 1;
      const threshold = w * 0.18;
      if (bestIdx !== activeIdxRef.current && bestDist < threshold) {
        activeIdxRef.current = bestIdx;
        setActiveIdx(bestIdx);
      }
    };

    const scrollToIdx = (idx: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const nodes = Array.from(scroller.querySelectorAll<HTMLElement>("[data-carousel-item]"));
      const node = nodes[idx];
      if (!node) return;
      node.scrollIntoView({ behavior, inline: "center", block: "nearest" });
    };

    // Center the first card after layout.
    requestAnimationFrame(() => {
      scrollToIdx(initialIdx, "auto");
      computeActive();
    });

    const onScroll = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(computeActive);
    };

    const onResize = () => computeActive();

    computeActive();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [itemsLen, title]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable)
        return;

      const scroller = scrollerRef.current;
      if (!scroller) return;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = Math.max(0, Math.min(itemsLen - 1, activeIdxRef.current + dir));
      if (next === activeIdxRef.current) return;
      e.preventDefault();
      activeIdxRef.current = next;
      setActiveIdx(next);
      const nodes = Array.from(scroller.querySelectorAll<HTMLElement>("[data-carousel-item]"));
      nodes[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [itemsLen]);

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text)] sm:text-[20px]">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <span className="text-[12px] font-semibold tracking-[0.02em] text-[rgba(232,234,238,0.44)]">
            Use
          </span>
          <KeyCap>←</KeyCap>
          <KeyCap>→</KeyCap>
        </div>
      </header>

      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent"
        />

        <div
          ref={scrollerRef}
          tabIndex={0}
          className="no-scrollbar snap-x flex gap-3 overflow-x-auto overflow-y-visible px-0 py-4 [scrollbar-width:none] focus:outline-none touch-pan-y select-none cursor-grab active:cursor-grabbing"
          role="region"
          aria-label={typeof title === "string" ? title : "Carousel"}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            const el = scrollerRef.current;
            if (!el) return;
            const dir = e.key === "ArrowRight" ? 1 : -1;
            const next = Math.max(0, Math.min(items.length - 1, activeIdx + dir));
            if (next === activeIdx) return;
            e.preventDefault();
            setActiveIdx(next);
            const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-carousel-item]"));
            nodes[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          }}
          onPointerDown={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            drag.current.on = true;
            drag.current.pointerId = e.pointerId;
            drag.current.startX = e.clientX;
            drag.current.startScrollLeft = el.scrollLeft;
            el.style.scrollSnapType = "none";
            el.focus({ preventScroll: true });
            el.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            if (!drag.current.on) return;
            e.preventDefault();
            const dx = e.clientX - drag.current.startX;
            el.scrollLeft = drag.current.startScrollLeft - dx;
          }}
          onPointerUp={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            if (drag.current.pointerId != null) {
              try {
                el.releasePointerCapture(drag.current.pointerId);
              } catch {
                // no-op
              }
            }
            drag.current.on = false;
            drag.current.pointerId = null;
            el.style.scrollSnapType = "";
          }}
          onPointerCancel={() => {
            const el = scrollerRef.current;
            if (el) el.style.scrollSnapType = "";
            drag.current.on = false;
            drag.current.pointerId = null;
          }}
        >
          {/* Side spacers match card widths to avoid huge mobile gaps. */}
          <div
            aria-hidden
            className="shrink-0 w-[19vw] sm:w-[27vw] lg:w-[calc((100vw-420px)/2)]"
          />
          {items.map((child, idx) => {
            const dist = Math.abs(idx - activeIdx);
            const isActive = dist === 0;
            const isNear = dist === 1;
            const isFar = dist === 2;
            return (
              <div
                key={idx}
                data-carousel-item
                className="snap-item relative shrink-0 rounded-[26px] [scroll-snap-stop:always] will-change-transform transition-[transform,opacity] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transformOrigin: "center center",
                  transform: isActive
                    ? "translateZ(0) scale(1.00)"
                    : isNear
                      ? "translateZ(0) scale(0.82)"
                      : isFar
                        ? "translateZ(0) scale(0.74)"
                        : "translateZ(0) scale(0.70)",
                  opacity: isActive ? 1 : isNear ? 0.55 : isFar ? 0.30 : 0.18,
                }}
                aria-current={isActive ? "true" : "false"}
              >
                {child}
              </div>
            );
          })}
          <div
            aria-hidden
            className="shrink-0 w-[19vw] sm:w-[27vw] lg:w-[calc((100vw-420px)/2)]"
          />
        </div>
      </div>

      {hint ? (
        <div className="pt-2 md:hidden">
          <div className="mx-auto h-[3px] w-9 rounded-full bg-[rgba(232,234,238,0.22)]" />
          <p className="mt-3 text-center text-[13px] text-[rgba(232,234,238,0.55)]">
            {hint}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="grid h-7 min-w-7 place-items-center rounded-[8px] border border-[rgba(232,234,238,0.16)] bg-[rgba(232,234,238,0.04)] px-2 text-[12px] font-semibold text-[rgba(232,234,238,0.78)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_28px_rgba(0,0,0,0.35)]">
      {children}
    </kbd>
  );
}
