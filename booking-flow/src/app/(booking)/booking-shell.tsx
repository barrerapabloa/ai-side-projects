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
      <div className="min-h-dvh bg-[#07080a] text-zinc-100 lg:flex">
        <BookingSidebar />
        <main className="w-full flex-1 px-4 pb-32 pt-8 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </BookingProvider>
  );
}
