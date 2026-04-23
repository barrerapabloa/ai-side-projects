"use client";

import { BookingProvider } from "@/context/BookingContext";
import { BookingSidebar } from "@/components/BookingSidebar";

export default function BookingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <div className="relative isolate min-h-dvh text-zinc-100 lg:flex">
        {/* Ambient mesh — ToDesktop-like depth without obscuring UI */}
        <div
          aria-hidden
          className="bf-marketing-mesh pointer-events-none fixed inset-0 z-0"
        />
        <BookingSidebar />
        <main className="relative z-10 w-full flex-1 px-4 pb-32 pt-8 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </BookingProvider>
  );
}
