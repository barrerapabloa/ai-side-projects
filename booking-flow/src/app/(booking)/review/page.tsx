"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { airportLabel } from "@/data/airports";
import { formatUsd } from "@/lib/money";
import { fareTierAddOnUsdPerPax } from "@/lib/fareTier";
import {
  buildSeatsForFlight,
  seatMapFromList,
  totalSeatFees,
} from "@/lib/seats";
import { useBooking } from "@/context/BookingContext";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";

export default function ReviewPage() {
  const router = useRouter();
  const {
    search,
    selectedFlight,
    selectedReturnFlight,
    selectedSeatIds,
    passengers,
    selectedFareTier,
    reviewAccepted,
    setReviewAccepted,
  } = useBooking();

  const paxOk =
    !!search &&
    !!selectedFlight &&
    passengers.length === search.passengers &&
    passengers.every(
      (p) =>
        p.givenName.trim() &&
        p.familyName.trim() &&
        p.email.trim() &&
        p.dateOfBirth &&
        p.passportNumber.trim() &&
        p.passportCountry.trim() &&
        p.passportExpiry,
    );
  useRedirectUnless(paxOk, "/search");

  const { fareSubtotal, seatFees, total } = useMemo(() => {
    if (
      !search ||
      !selectedFlight ||
      (search.tripType === "round-trip" && !selectedReturnFlight)
    ) {
      return { fareSubtotal: 0, seatFees: 0, total: 0 };
    }
    const seats = buildSeatsForFlight(selectedFlight.id, selectedFlight.cabinTier);
    const map = seatMapFromList(seats);
    const seatFees = totalSeatFees(selectedSeatIds, map);
    const addOn = fareTierAddOnUsdPerPax(selectedFareTier, selectedFlight.cabinTier);
    const legs = search.tripType === "round-trip" ? 2 : 1;
    const base =
      selectedFlight.priceUsd +
      (search.tripType === "round-trip" ? selectedReturnFlight?.priceUsd ?? 0 : 0);
    const fareSubtotal = (base + addOn * legs) * search.passengers;
    return {
      fareSubtotal,
      seatFees,
      total: fareSubtotal + seatFees,
    };
  }, [search, selectedFlight, selectedReturnFlight, selectedSeatIds, selectedFareTier]);

  if (!search || !selectedFlight) return null;

  return (
    <>
      <div className="space-y-8 pb-40 lg:pb-8">
        <StepHeading
          step="Step 5 · Review"
          title="Review before you pay"
          subtitle="Confirm flight, seats, and travelers. Use links below to jump back if something’s wrong."
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-zinc-900/35 via-zinc-950/60 to-zinc-950 ring-1 ring-white/[0.06]">
              <div className="border-b border-white/[0.06] bg-white/[0.03] px-5 py-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200">
                  Flight timeline
                </h2>
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-white/[0.06] p-5 sm:border-b-0 sm:border-r">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Leave {search.origin}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                    {selectedFlight.departLabel}
                  </p>
                  <p className="mt-2 text-[13px] text-zinc-400">
                    {airportLabel(search.origin)}
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Arrive {search.destination}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                    {selectedFlight.arriveLabel}
                  </p>
                  <p className="mt-2 text-[13px] text-zinc-400">
                    {airportLabel(search.destination)}
                  </p>
                  <p className="mt-3 text-[12px] text-zinc-500">
                    {selectedFlight.arriveDaySummary}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 border-t border-white/[0.06] px-5 py-4 text-[13px] text-zinc-400">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-zinc-300">
                  {selectedFlight.stopsLabel}
                </span>
                <span>{selectedFlight.durationLabel} total travel</span>
                <span className="text-zinc-600">·</span>
                <span>{selectedFlight.aircraftType}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 ring-1 ring-white/[0.04]">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Seats & bundles
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {selectedSeatIds.map((id) => (
                  <span
                    key={id}
                      className="inline-flex items-center rounded-lg border border-white/[0.14] bg-white/[0.06] px-3 py-2 text-sm font-medium tabular-nums text-white"
                  >
                    {id}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">
                {selectedFlight.baggageIncluded}. Seat fees add to your base fare.
              </p>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 ring-1 ring-white/[0.04]">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Travelers
              </h2>
              <ul className="mt-4 space-y-4">
                {passengers.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-4 rounded-xl bg-black/30 px-4 py-3 ring-1 ring-white/[0.06]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-semibold text-white">
                      {p.givenName.slice(0, 1)}
                      {p.familyName.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-white">
                        {p.givenName} {p.familyName}
                      </p>
                      <p className="truncate text-[13px] text-zinc-500">{p.email}</p>
                      <p className="mt-1 text-[12px] text-zinc-600">
                        Seat {selectedSeatIds[i]} · DOB {p.dateOfBirth}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start space-y-4">
            <TripSummaryCard
              search={search}
              flight={selectedFlight}
              returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
              seatExtrasUsd={seatFees}
              seatIds={selectedSeatIds}
              seatSummary={selectedSeatIds.join(", ")}
            />

            <div className="rounded-2xl border border-white/[0.1] bg-zinc-950/80 p-5 ring-1 ring-white/[0.05]">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-zinc-500">
                Trip total
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-zinc-400">
                  <dt>Fares × {search.passengers}</dt>
                  <dd>{formatUsd(fareSubtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-zinc-400">
                  <dt>Seat selection</dt>
                  <dd>{formatUsd(seatFees)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/[0.08] pt-3 text-base font-semibold text-white">
                  <dt>Due today</dt>
                  <dd>{formatUsd(total)}</dd>
                </div>
              </dl>

              <label className="mt-5 flex cursor-pointer gap-3 text-[13px] leading-snug text-zinc-400">
                <input
                  type="checkbox"
                  checked={reviewAccepted}
                  onChange={(e) => setReviewAccepted(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-white/[0.2] bg-black accent-white"
                />
                I understand charges are simulated — no ticket is issued and card data is not sent to a processor.
              </label>

              <button
                type="button"
                disabled={!reviewAccepted}
                onClick={() => router.push("/payment")}
                className="bf-btn-primary-bar mt-5 w-full py-3 disabled:cursor-not-allowed"
              >
                Continue to payment · {formatUsd(total)}
              </button>

              <Link
                href="/passengers"
                className="mt-4 block text-center text-[13px] text-zinc-300 underline underline-offset-2 transition-colors duration-200 hover:text-white"
              >
                Edit travelers
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile / narrow: sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.10] bg-[#07080a]/94 p-4 backdrop-blur-xl lg:hidden">
        <label className="flex cursor-pointer gap-3 border-b border-white/[0.06] pb-3 text-[12px] leading-snug text-zinc-400">
          <input
            type="checkbox"
            checked={reviewAccepted}
            onChange={(e) => setReviewAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-white/[0.2] bg-black accent-white"
          />
          Simulated charge — no ticket issued.
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Due today
            </p>
            <p className="text-lg font-semibold text-white">{formatUsd(total)}</p>
          </div>
          <button
            type="button"
            disabled={!reviewAccepted}
            onClick={() => router.push("/payment")}
            className="bf-btn-primary-bar min-h-11 shrink-0 px-5 py-2.5 disabled:opacity-40"
          >
            Pay {formatUsd(total)}
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
