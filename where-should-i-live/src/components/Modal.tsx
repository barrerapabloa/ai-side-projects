"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";

export function Modal({
  title,
  open,
  onClose,
  header,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  /** Fixed area above scroll (title row, tabs). Prevents content scrolling under the header. */
  header?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        aria-hidden="true"
        onMouseDown={onClose}
        className="absolute inset-0 z-0 bg-black/35"
      />
      <div className="relative z-10 flex max-h-[calc(100dvh-48px)] w-full max-w-[486px] flex-col overflow-hidden rounded-none bg-white shadow-[0_26px_80px_rgba(0,0,0,0.22)]">
        {header ? (
          <div className="shrink-0 border-b border-black/[0.08] bg-white px-7 pb-4 pt-6 sm:px-8 sm:pt-7">
            {header}
          </div>
        ) : null}
        <div
          className={cx(
            "flex min-h-0 flex-1 flex-col overflow-y-auto",
            header ? "px-7 pb-6 pt-5 sm:px-8 sm:pb-7" : "px-7 py-6 sm:px-8 sm:py-7",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
