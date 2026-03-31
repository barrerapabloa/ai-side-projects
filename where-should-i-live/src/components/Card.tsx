import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-line bg-surfaceStrong shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

