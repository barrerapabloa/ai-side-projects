import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-none border border-line bg-white px-3 py-1 text-xs text-ink/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

