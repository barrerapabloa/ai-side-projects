"use client";

/** Decorative great-circle–style arc between airports (no geo accuracy — visual only). */
export function RouteMapIllustration({
  originCode,
  destinationCode,
}: {
  originCode: string;
  destinationCode: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-sky-950/50 via-zinc-950 to-zinc-950 ring-1 ring-white/[0.05]">
      <div className="absolute inset-0 opacity-[0.35]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="globe-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M48 0H0v48"
                fill="none"
                stroke="rgba(148,163,184,0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#globe-grid)" />
          <ellipse
            cx="50%"
            cy="115%"
            rx="75%"
            ry="95%"
            fill="none"
            stroke="rgba(56,189,248,0.07)"
            strokeWidth="2"
          />
        </svg>
      </div>
      <svg
        viewBox="0 0 560 112"
        className="relative z-[1] mx-auto h-[76px] w-full max-h-[76px] sm:h-[84px] sm:max-h-[84px]"
        aria-hidden
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.95)" />
            <stop offset="50%" stopColor="rgba(129,140,248,0.75)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.95)" />
          </linearGradient>
        </defs>
        <path
          d="M 72 78 Q 280 26 488 68"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 10"
          opacity={0.85}
        />
        <circle cx="72" cy="78" r="9" fill="#0ea5e9" opacity={0.95} />
        <circle cx="488" cy="68" r="9" fill="#818cf8" opacity={0.95} />
        <circle cx="72" cy="78" r="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
        <circle cx="488" cy="68" r="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
      </svg>
      <div className="relative z-[1] flex justify-between px-5 pb-3 pt-0 text-[12px] font-medium text-white">
        <span className="font-mono tracking-wide">{originCode}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Route
        </span>
        <span className="font-mono tracking-wide">{destinationCode}</span>
      </div>
    </div>
  );
}
