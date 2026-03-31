"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import type { CityResult } from "@/lib/types";
import { cx } from "@/lib/cx";

const POINTER_TILT_DECK = 13;
const POINTER_TILT_EXPANDED = 10;

/** Map $ / $$ / $$$ to a 1–5 “budget pressure” scale for the bar rating. */
function costToTier(cost: string): number {
  const n = (cost.match(/\$/g) || []).length;
  if (n >= 3) return 5;
  if (n === 2) return 3;
  if (n === 1) return 2;
  return 3;
}

function CostRating({ cost, compact }: { cost: string; compact?: boolean }) {
  const tier = costToTier(cost);
  return (
    <div
      className={cx("flex flex-col items-end gap-1", compact && "gap-0.5")}
      role="img"
      aria-label={`Cost level ${tier} of 5`}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/40">Cost</span>
      <div className="flex gap-px">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cx(
              "rounded-[1px]",
              compact ? "h-1.5 w-3" : "h-2 w-3.5 sm:w-4",
              i < tier ? "bg-ink/62" : "bg-ink/11",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PointerTilt({
  children,
  maxTilt,
  className,
}: {
  children: ReactNode;
  maxTilt: number;
  className?: string;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: py * -maxTilt, ry: px * maxTilt });
  }

  function handleLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <motion.div
      className={cx("[transform-style:preserve-3d]", className)}
      style={{ transformPerspective: 1200 }}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
      transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.6 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

function truncateAtWord(s: string, max: number): string {
  const t = s.replaceAll(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > max * 0.55) return slice.slice(0, lastSpace) + "…";
  return slice.trimEnd() + "…";
}

function CompactSources({ sources }: { sources: NonNullable<CityResult["sources"]> }) {
  return (
    <p className="mt-4 text-[12px] leading-relaxed text-ink/50">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/35">
        Sources{" "}
      </span>
      {sources.slice(0, 6).map((s, i) => (
        <span key={s.url}>
          {i > 0 ? <span className="text-ink/20"> · </span> : null}
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink/65 underline decoration-black/15 underline-offset-[3px] hover:text-ink"
          >
            {s.title}
          </a>
        </span>
      ))}
    </p>
  );
}

/** Wikipedia / Wikimedia often block empty referrer; default policy loads more reliably. */
function CityCardImage({
  src,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cx("h-full w-full bg-gradient-to-br from-[#e8e0d4] via-[#ddd4c4] to-[#c9bba8]", className)}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function IconBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-current", className)}>
      {children}
    </span>
  );
}

function iconForMatchLabel(label: string) {
  const s = label.toLowerCase();
  if (s.includes("remote") || s.includes("wifi")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" />
          <path d="M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("nature") || s.includes("outdoor")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 22v-8" strokeLinecap="round" />
          <path
            d="M7 12c0-3 2.5-6 5-8 2.5 2 5 5 5 8a5 5 0 1 1-10 0Z"
            strokeLinejoin="round"
          />
        </svg>
      </IconBox>
    );
  }
  if (
    s.includes("warm") ||
    s.includes("cool") ||
    s.includes("cold") ||
    s.includes("climate") ||
    s.includes("season")
  ) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("city") || s.includes("energy") || s.includes("urban")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6-3v13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9h.01M9 13h.01M9 17h.01" strokeLinecap="round" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("night") || s.includes("party") || s.includes("social")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("pace") || s.includes("slow") || s.includes("chill")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("region")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      </IconBox>
    );
  }
  if (s.includes("safe")) {
    return (
      <IconBox>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
        </svg>
      </IconBox>
    );
  }
  return (
    <IconBox>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="m12 3 1.9 5.8h6l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4.1 8.8h6L12 3Z" strokeLinejoin="round" />
      </svg>
    </IconBox>
  );
}

function MatchBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 py-1 text-[11px] text-ink/75">
      <span className="text-ink/45">{iconForMatchLabel(label)}</span>
      {label}
    </span>
  );
}

/** Fan + vertical offset so every card has a visible edge (easier to tap). */
const DECK = [
  { rot: -10, x: -52, y: 8, z: 30 },
  { rot: 0, x: 0, y: 0, z: 20 },
  { rot: 10, x: 52, y: 8, z: 10 },
] as const;

export function ResultsCardStack({ cities }: { cities: CityResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (cities.length !== 3) {
    return (
      <div className="text-center text-sm text-muted">
        {cities.length === 0 ? "No cities to show." : "Expected exactly three cities."}
      </div>
    );
  }

  function handleCardClick(index: number) {
    setExpanded((prev) => (prev === index ? null : index));
  }

  return (
    <div className="mx-auto w-full max-w-xl px-2">
      <div className="relative flex min-h-[300px] flex-col items-center justify-end pb-1 sm:min-h-[330px]">
        <AnimatePresence mode="wait" initial={false}>
          {expanded === null ? (
            <motion.div
              key="deck"
              className="relative h-[320px] w-full max-w-[340px] will-change-transform [perspective:1100px] [transform-style:preserve-3d] sm:h-[360px] sm:max-w-[380px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
            >
              {cities.map((city, index) => {
                const d = DECK[index]!;
                return (
                  <motion.div
                    key={`${city.name}-${city.country}`}
                    className="absolute bottom-0 left-1/2 flex w-full items-start justify-center will-change-transform"
                    style={{ zIndex: d.z }}
                    initial={false}
                    animate={{
                      x: `calc(-50% + ${d.x}px)`,
                      y: d.y,
                      rotate: d.rot,
                    }}
                    whileTap={{ scale: 0.985 }}
                    transition={{
                      type: "tween",
                      duration: 0.45,
                      ease: easeOut,
                    }}
                  >
                    <PointerTilt
                      maxTilt={POINTER_TILT_DECK}
                      className="w-[88%] max-w-[300px] shrink-0 sm:max-w-[320px]"
                    >
                    <button
                      type="button"
                      onClick={() => handleCardClick(index)}
                      className={cx(
                        "playingCardFx relative z-[1] flex min-h-0 w-full cursor-pointer flex-col items-stretch overflow-hidden rounded-[22px] border border-black/[0.1] bg-[#f3efe6] text-left shadow-[0_22px_50px_rgba(0,0,0,0.14)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
                        "transition-shadow duration-200 hover:shadow-[0_26px_56px_rgba(0,0,0,0.2)]",
                      )}
                    >
                      <div className="tradingCardGrain pointer-events-none absolute inset-0 z-0" aria-hidden />
                      <div className="card-shimmer-layer">
                        <div className="card-shimmer-sweep" />
                        <div className="card-glitter-dots" />
                      </div>
                      <div className="relative z-[2] flex min-h-0 w-full flex-col">
                        {/* Match expanded: 3/2 image, badge inset, text block top-aligned (no flex growth in footer). */}
                        <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#f3efe6]">
                          <CityCardImage
                            src={city.imageUrl}
                            className="card-mask-image-bottom h-full w-full object-cover object-[50%_42%]"
                          />
                          <div className="absolute left-4 top-4 z-[2] rounded-full border border-black/10 bg-white/70 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink backdrop-blur-[2px] sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.14em]">
                            {index + 1} / 3
                          </div>
                        </div>
                        <div className="shrink-0 px-5 pb-4 pt-4 sm:px-6">
                          <div className="flex items-baseline justify-between gap-3 sm:gap-4">
                            <div className="serifTitle min-w-0 flex-1 text-[22px] leading-[0.95] tracking-tight sm:text-[24px]">
                              {city.name}
                            </div>
                            <CostRating cost={city.cost} compact />
                          </div>
                          <div className="mt-1 text-[13px] text-ink/50">{city.country}</div>
                        </div>
                      </div>
                    </button>
                    </PointerTilt>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              className="w-full will-change-transform"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              {cities.map((city, index) => {
                if (index !== expanded) return null;
                return (
                  <PointerTilt
                    key={`${city.name}-${city.country}-expanded`}
                    maxTilt={POINTER_TILT_EXPANDED}
                    className="relative mx-auto w-full max-w-[420px]"
                  >
                  <motion.div
                    role="article"
                    className="relative overflow-hidden rounded-[22px] border border-black/[0.1] bg-[#f3efe6] text-left shadow-[0_28px_70px_rgba(0,0,0,0.16)]"
                    initial={false}
                  >
                    <div className="pointer-events-none absolute inset-0 z-0">
                      <div className="tradingCardGrain absolute inset-0" aria-hidden />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCardClick(index)}
                      className="relative z-[2] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/25"
                      aria-expanded
                    >
                      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#f3efe6]">
                        <CityCardImage
                          src={city.imageUrl}
                          className="card-mask-image-bottom h-full w-full object-cover object-[50%_42%]"
                        />
                        <div className="absolute left-4 top-4 z-[2] rounded-full border border-black/10 bg-white/70 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-[2px]">
                          {index + 1} of 3 · tap to fold deck
                        </div>
                      </div>
                      <div className="relative px-6 pb-6 pt-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="serifTitle min-w-0 flex-1 text-[36px] leading-[0.95] sm:text-[42px]">
                            {city.name}
                          </h3>
                          <CostRating cost={city.cost} />
                        </div>
                        <p className="mt-1 text-[13px] text-ink/50">{city.country}</p>
                        <p className="mt-3 text-[14px] leading-[1.75] text-ink/65">
                          {truncateAtWord(city.summary, 320)}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {city.whyItMatches.slice(0, 4).map((w) => (
                            <MatchBadge key={w} label={w} />
                          ))}
                        </div>
                        {city.sources?.length ? <CompactSources sources={city.sources} /> : null}
                      </div>
                    </button>
                    <div className="expandedCardGlitter" aria-hidden>
                      <div className="expandedCardGlitterSweep" />
                      <div className="expandedCardGlitterSparkle" />
                    </div>
                  </motion.div>
                  </PointerTilt>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
