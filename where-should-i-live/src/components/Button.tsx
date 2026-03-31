import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-none px-4 text-[13px] font-medium tracking-wide",
        "bg-black text-white",
        "hover:bg-black/90 active:translate-y-[1px]",
        "transition-[transform,background-color] duration-150",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
    />
  );
}

