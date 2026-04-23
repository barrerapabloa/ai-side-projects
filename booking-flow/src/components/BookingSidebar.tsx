"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";
import { formatTripDate } from "@/lib/datetime";
import { useBooking } from "@/context/BookingContext";

const STEPS = [
  { href: "/search", label: "Search" },
  { href: "/flights", label: "Flights" },
  { href: "/fare", label: "Fare" },
  { href: "/seats", label: "Seats" },
  { href: "/passengers", label: "Travelers" },
  { href: "/review", label: "Review" },
  { href: "/payment", label: "Pay" },
  { href: "/confirmation", label: "Done" },
] as const;

export function BookingSidebar() {
  const pathname = usePathname();
  const {
    search,
    selectedFlight,
    selectedReturnFlight,
    selectedFareTier,
    selectedSeatIds,
    passengers,
    reviewAccepted,
    paidAt,
    confirmationCode,
  } = useBooking();

  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.href));
  const current = STEPS[Math.max(0, activeIndex)]?.label ?? "Booking";

  const unlockedIndex = (() => {
    // Step 1: Search is always reachable
    if (!search?.origin) return 0;

    // Step 2: Flights unlocked once search exists
    const hasFlightsBase = Boolean(
      selectedFlight && (search.tripType !== "round-trip" || selectedReturnFlight),
    );
    if (!hasFlightsBase) return 1;

    // Step 3: Fare unlocked once flights chosen
    if (!selectedFareTier) return 2;

    // Step 4: Seats unlocked once fare chosen
    const seatTarget = search.passengers ?? 1;
    const seatsDone = selectedSeatIds.length === seatTarget && seatTarget > 0;
    if (!seatsDone) return 3;

    // Step 5: Travelers unlocked once seats picked
    const paxDone = passengers.length === seatTarget;
    if (!paxDone) return 4;

    // Step 6: Review unlocked once traveler count matches
    if (!reviewAccepted) return 5;

    // Step 7: Pay unlocked after accepting review
    if (!paidAt || !confirmationCode) return 6;

    // Step 8: Done unlocked after payment completes
    return 7;
  })();

  return (
    <>
      {/* Mobile: minimal top strip */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-transparent backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/search"
            className="text-white transition-opacity duration-200 hover:opacity-90"
          >
            <BrandWordmark />
          </Link>
          <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-500">
            {current}
          </p>
        </div>
      </header>

      {/* Desktop: left sidebar */}
      <aside className="relative z-10 hidden lg:block lg:sticky lg:top-0 lg:h-dvh lg:w-[280px] lg:border-r lg:border-white/[0.06] lg:bg-transparent lg:backdrop-blur-xl">
        <div className="flex h-full flex-col px-5 py-5">
          <Link
            href="/search"
            className="text-white transition-opacity duration-200 hover:opacity-90"
          >
            <BrandWordmark />
          </Link>

          {search?.origin ? (
            <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.04]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Trip
              </p>
              <p className="mt-1 text-[14px] font-semibold tabular-nums text-white">
                {search.origin} <span className="text-zinc-600">→</span>{" "}
                {search.destination}
              </p>
              <p className="mt-1 text-[12px] text-zinc-400">
                {formatTripDate(search.departDate)}
              </p>
              {selectedFlight ? (
                <p className="mt-2 text-[12px] text-zinc-500">
                  NMB {selectedFlight.flightNumber} · {selectedFlight.departLabel}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-[13px] text-zinc-500">Choose cities to begin.</p>
          )}

          <nav aria-label="Booking steps" className="mt-6 flex flex-col gap-1.5">
            {STEPS.map((step, i) => {
              const isCurrent =
                pathname === step.href || pathname.startsWith(`${step.href}/`);
              const isPast = activeIndex > i;
              const enabled = i <= unlockedIndex || isPast || isCurrent;
              return (
                enabled ? (
                  <Link
                    key={step.href}
                    href={step.href}
                    className={`bf-interactive-surface flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium ${
                      isCurrent
                        ? "border border-white/[0.14] bg-white/[0.06] text-white ring-1 ring-white/[0.06]"
                        : isPast
                          ? "text-zinc-200 hover:bg-white/[0.06]"
                          : "text-zinc-500 hover:bg-white/[0.04]"
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <span>
                      <span className="mr-2 tabular-nums text-zinc-500">
                        {i + 1}.
                      </span>
                      {step.label}
                    </span>
                    {isCurrent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                    ) : null}
                  </Link>
                ) : (
                  <div
                    key={step.href}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-600 opacity-70"
                  >
                    <span>
                      <span className="mr-2 tabular-nums text-zinc-700">
                        {i + 1}.
                      </span>
                      {step.label}
                    </span>
                  </div>
                )
              );
            })}
          </nav>

          <div className="mt-auto pt-6 text-[11px] text-zinc-600">
            Tip: you can change earlier steps before paying.
          </div>
        </div>
      </aside>
    </>
  );
}

