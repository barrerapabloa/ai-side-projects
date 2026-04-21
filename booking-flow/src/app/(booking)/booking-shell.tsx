"use client";

import { BookingProvider } from "@/context/BookingContext";
import { BookingHeader } from "@/components/BookingHeader";

export default function BookingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <div className="min-h-dvh bg-[#07080a] text-zinc-100">
        <BookingHeader />
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-8">{children}</main>
      </div>
    </BookingProvider>
  );
}
