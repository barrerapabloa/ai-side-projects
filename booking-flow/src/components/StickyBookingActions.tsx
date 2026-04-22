"use client";

import Link from "next/link";

type StickyBookingActionsProps = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryHref: string;
  secondaryLabel: string;
  summaryLabel: string;
  summaryValue: string;
  hint?: string;
};

/**
 * Keeps primary CTAs above the fold on tall pages (seat map, long forms).
 */
export function StickyBookingActions({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryHref,
  secondaryLabel,
  summaryLabel,
  summaryValue,
  hint,
}: StickyBookingActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.10] bg-[#07080a]/94 backdrop-blur-xl supports-[backdrop-filter]:bg-[#07080a]/85 transition-colors duration-200">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {summaryLabel}
          </p>
          <p className="truncate font-semibold tabular-nums text-white">{summaryValue}</p>
          {hint ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2 sm:justify-end">
          <Link href={secondaryHref} className="bf-btn-secondary-bar">
            {secondaryLabel}
          </Link>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className="bf-btn-primary-bar"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#07080a]/94 supports-[backdrop-filter]:bg-[#07080a]/85" />
    </div>
  );
}
