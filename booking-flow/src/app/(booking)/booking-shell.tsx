"use client";

import { BookingProvider } from "@/context/BookingContext";
import { BookingSidebar } from "@/components/BookingSidebar";
import { usePathname } from "next/navigation";

export default function BookingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isConfirmation = pathname.startsWith("/confirmation");

  return (
    <BookingProvider>
      <div className="relative isolate min-h-dvh text-zinc-100 lg:flex">
        {/* Ambient mesh — ToDesktop-like depth without obscuring UI */}
        <div
          aria-hidden
          className="bf-marketing-mesh pointer-events-none fixed inset-0 z-0"
        />
        {isConfirmation ? null : <BookingSidebar />}
        <main
          className={`relative z-10 w-full flex-1 px-4 pb-32 pt-8 lg:px-10 ${
            isConfirmation ? "lg:pt-10" : ""
          }`.trim()}
        >
          <div className={`mx-auto ${isConfirmation ? "max-w-6xl" : "max-w-5xl"}`.trim()}>
            {children}
          </div>
        </main>
      </div>
    </BookingProvider>
  );
}
