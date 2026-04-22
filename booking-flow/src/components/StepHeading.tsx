import type { ReactNode } from "react";

type StepHeadingProps = {
  /** Short label, e.g. "Step 2 · Flights" */
  step: string;
  title: string;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

/**
 * One primary title per step — keeps the funnel readable without stacking repeated trip rows.
 */
export function StepHeading({
  step,
  title,
  subtitle,
  align = "left",
  className = "",
}: StepHeadingProps) {
  const alignCls = align === "center" ? "text-center" : "";

  return (
    <header className={`${alignCls} ${className}`.trim()}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
        {step}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <div
          className={`mt-2 max-w-prose text-[15px] leading-relaxed text-zinc-400 ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </div>
      ) : null}
    </header>
  );
}
