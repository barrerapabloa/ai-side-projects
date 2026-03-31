import type { ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { CompassIcon } from "@/components/CompassIcon";

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("min-h-dvh flex flex-col px-6", className)}>
      <header className="relative z-30 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-center bg-transparent pt-8 pb-3">
        <Link
          href="/"
          className="serifTitle inline-flex items-center gap-1 text-lg font-normal text-ink sm:text-xl"
        >
          <span className="inline-flex h-7 w-5 shrink-0 items-center justify-center bg-transparent text-black">
            <CompassIcon size={20} />
          </span>
          HomeCompass
        </Link>
      </header>

      <main className="relative z-0 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-start pb-0">
        {children}
      </main>
    </div>
  );
}

