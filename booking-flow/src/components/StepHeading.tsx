import type { ReactNode } from "react";

type StepHeadingProps = {
  /** Short label, e.g. "Step 2 · Flights" */
  step: string;
  title: string;
  subtitle?: ReactNode;
  align?: "left" | "center";
  /** Larger hero typography (pricing / SaaS landing scale); default for all funnel steps */
  tone?: "default" | "hero";
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
  tone = "hero",
  className = "",
}: StepHeadingProps) {
  const alignCls = align === "center" ? "text-center" : "";
  const hero = tone === "hero";

  return (
    <header className={`${alignCls} ${className}`.trim()}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {step}
      </p>
      <h1
        className={`font-semibold tracking-tight text-white ${
          hero
            ? "mt-3 text-[28px] leading-[1.12] sm:text-3xl lg:text-4xl lg:tracking-tighter"
            : "mt-2 text-2xl sm:text-3xl"
        }`}
      >
        {title}
      </h1>
      {subtitle ? (
        <div
          className={`mt-3 leading-relaxed text-zinc-400 ${
            hero ? "max-w-2xl text-base" : "max-w-prose text-[15px]"
          } ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </div>
      ) : null}
    </header>
  );
}
