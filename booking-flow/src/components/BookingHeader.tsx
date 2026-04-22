"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";
import { formatTripDate } from "@/lib/datetime";
import { useBooking } from "@/context/BookingContext";

const STEPS = [
  { href: "/search", label: "Search" },
  { href: "/flights", label: "Flights" },
  { href: "/seats", label: "Seats" },
  { href: "/passengers", label: "Travelers" },
  { href: "/review", label: "Review" },
  { href: "/payment", label: "Pay" },
  { href: "/confirmation", label: "Done" },
] as const;

export function BookingHeader() {
  const pathname = usePathname();
  const { search, selectedFlight } = useBooking();

  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.href));

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07080a]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/search" className="text-white transition-opacity duration-200 hover:opacity-90">
            <BrandWordmark />
          </Link>
          {search?.origin ? (
            <p className="max-w-[min(100%,20rem)] truncate text-right text-[13px] tabular-nums text-zinc-400 sm:max-w-none">
              <span className="font-semibold text-zinc-200">{search.origin}</span>
              <span className="text-zinc-600">→</span>
              <span className="font-semibold text-zinc-200">{search.destination}</span>
              <span className="text-zinc-600"> · </span>
              {formatTripDate(search.departDate)}
            </p>
          ) : (
            <p className="text-[13px] text-zinc-600">Choose cities to begin</p>
          )}
        </div>

        {selectedFlight ? (
          <p className="text-[12px] text-zinc-500">
            NMB {selectedFlight.flightNumber} · {selectedFlight.departLabel} ·{" "}
            {selectedFlight.durationLabel}
          </p>
        ) : null}

        <nav aria-label="Booking steps" className="flex flex-wrap gap-1.5">
          {STEPS.map((step, i) => {
            const current = pathname === step.href || pathname.startsWith(`${step.href}/`);
            const past = activeIndex > i;
            return (
              <span
                key={step.href}
                className={`rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200 ${
                  current
                    ? "bg-white text-black"
                    : past
                      ? "text-zinc-400"
                      : "text-zinc-600"
                }`}
              >
                {i + 1}. {step.label}
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
