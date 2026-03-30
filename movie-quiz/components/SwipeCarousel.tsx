"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
};

export function SwipeCarousel({ title, subtitle, children }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const childCount = useMemo(() => {
    return Array.isArray(children) ? children.length : 1;
  }, [children]);
  const drag = useRef<{
    on: boolean;
    startX: number;
    startScrollLeft: number;
    pointerId: number | null;
  }>({ on: false, startX: 0, startScrollLeft: 0, pointerId: null });

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useMemo(() => {
    return () => {
      const el = scrollerRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft < max - 4);
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // When content changes (e.g. new recommendations), snap back to the start
    // so the first card is always visible without scrolling.
    el.scrollLeft = 0;
    updateArrows();
    const onScroll = () => updateArrows();
    const onResize = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateArrows, childCount, title]);

  const nudge = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(260, Math.floor(el.clientWidth * 0.82));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-4">
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

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={`grid h-9 w-9 place-items-center rounded-[10px] border text-[var(--text)] transition ${
              canLeft
                ? "border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]"
                : "border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] opacity-50"
            }`}
            onClick={() => nudge(-1)}
            aria-label="Scroll left"
            disabled={!canLeft}
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            className={`grid h-9 w-9 place-items-center rounded-[10px] border text-[var(--text)] transition ${
              canRight
                ? "border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]"
                : "border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] opacity-50"
            }`}
            onClick={() => nudge(1)}
            aria-label="Scroll right"
            disabled={!canRight}
          >
            <ArrowRight />
          </button>
        </div>
      </header>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--bg)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--bg)] to-transparent"
        />

        <div
          ref={scrollerRef}
          className="no-scrollbar snap-x flex gap-4 overflow-x-auto overflow-y-visible px-10 py-3"
          role="region"
          aria-label={typeof title === "string" ? title : "Carousel"}
          onPointerDown={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            drag.current.on = true;
            drag.current.pointerId = e.pointerId;
            drag.current.startX = e.clientX;
            drag.current.startScrollLeft = el.scrollLeft;
            el.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            if (!drag.current.on) return;
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
          }}
          onPointerCancel={() => {
            drag.current.on = false;
            drag.current.pointerId = null;
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

