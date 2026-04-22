"use client";

import { useMemo } from "react";
import type { CabinTier, Flight, SearchState } from "@/types/booking";
import { airportLabel } from "@/data/airports";
import { getDestinationInsight } from "@/data/destinationInfo";
import { formatTripDate } from "@/lib/datetime";
import { formatUsd } from "@/lib/money";

function cabinTierBadge(tier: CabinTier | undefined): string {
  switch (tier ?? "economy") {
    case "business":
      return "border-violet-400/35 bg-violet-500/15 text-violet-100 ring-violet-400/25";
    case "first":
      return "border-amber-400/40 bg-amber-500/15 text-amber-100 ring-amber-400/25";
    default:
      return "border-white/[0.08] bg-white/[0.06] text-zinc-300 ring-white/[0.08]";
  }
}

type TripSummaryCardProps = {
  search: SearchState;
  flight: Flight;
  returnFlight?: Flight | null;
  /** Seat fees so far (optional). */
  seatExtrasUsd?: number;
  /** Comma-separated seat ids for display */
  seatSummary?: string;
  /** Optional seat ids so we can render richer callouts (exit row, etc.) */
  seatIds?: string[];
  variant?: "default" | "compact";
  /** Destination tips — off by default to reduce noise next to full itinerary. */
  showDestinationInsight?: boolean;
};

export function TripSummaryCard({
  search,
  flight,
  returnFlight = null,
  seatExtrasUsd = 0,
  seatSummary,
  seatIds,
  variant = "default",
  showDestinationInsight = false,
}: TripSummaryCardProps) {
  const compact = variant === "compact";
  const destInfo = getDestinationInsight(search.destination);
  const seatsInfo = useMemo(() => {
    if (!seatIds?.length)
      return { exitRow: false, bagsNotAllowedAtSeat: false, seatCabin: null as CabinTier | null };
    const anyExit = seatIds.some((id) => {
      const row = parseInt(id, 10);
      return row === 14 || row === 15;
    });
    const anyBulkhead = seatIds.some((id) => {
      const row = parseInt(id, 10);
      return row === 1;
    });
    const anyBusinessCabin = seatIds.some((id) => {
      const row = parseInt(id, 10);
      return row >= 1 && row <= 6;
    });
    const bagsNotAllowedAtSeat = anyExit || anyBulkhead;
    return {
      exitRow: anyExit,
      bagsNotAllowedAtSeat,
      seatCabin: anyBusinessCabin ? ("business" as CabinTier) : ("economy" as CabinTier),
    };
  }, [seatIds]);

  return (
    <section
      className={`rounded-2xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.04] ${
        compact ? "text-[13px]" : ""
      }`}
      aria-label="Trip summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            Your itinerary
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-white">
            {airportLabel(search.origin)}{" "}
            <span className="text-zinc-600" aria-hidden>
              →
            </span>{" "}
            {airportLabel(search.destination)}
          </p>
          <p className="mt-1 text-[13px] text-zinc-400">
            Depart {formatTripDate(search.departDate)}
            {search.tripType === "round-trip" && search.returnDate ? (
              <>
                {" "}
                · Return {formatTripDate(search.returnDate)}
              </>
            ) : null}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
            {search.tripType === "round-trip" ? "Round trip" : "One-way"} ·{" "}
            {search.passengers} {search.passengers === 1 ? "guest" : "guests"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-200 ring-1 ring-white/[0.08]">
            {flight.stopsLabel}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${cabinTierBadge(flight.cabinTier)}`}
          >
            {flight.fareLabel}
          </span>
          {seatsInfo.seatCabin === "business" && (flight.cabinTier ?? "economy") !== "business" ? (
            <span className="whitespace-nowrap rounded-full border border-violet-400/35 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-100 ring-1 ring-violet-400/25">
              Business seat <span className="text-violet-200/80">(upgrade)</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/[0.06]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Departs
          </p>
          <p className="mt-1 text-xl font-semibold text-white tabular-nums">
            {flight.departLabel}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">{search.origin}</p>
        </div>
        <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/[0.06]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Arrives
          </p>
          <p className="mt-1 text-xl font-semibold text-white tabular-nums">
            {flight.arriveLabel}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">{search.destination}</p>
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-zinc-400">
        {flight.arriveDaySummary} · Block time {flight.durationLabel}
      </p>

      <dl className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4 text-[13px]">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-zinc-500">Flight</dt>
          <dd className="text-zinc-200">
            NMB {flight.flightNumber}
          </dd>
        </div>
        {search.tripType === "round-trip" && returnFlight ? (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-zinc-500">Return</dt>
            <dd className="text-zinc-200">
              NMB {returnFlight.flightNumber} · {returnFlight.departLabel} → {returnFlight.arriveLabel}
            </dd>
          </div>
        ) : null}
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-zinc-500">Aircraft</dt>
          <dd className="text-zinc-200">{flight.aircraftType}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-zinc-500">Baggage</dt>
          <dd className="leading-snug text-zinc-300">{flight.baggageIncluded}</dd>
        </div>
        <div className="flex flex-wrap gap-3">
          <dt className="w-28 shrink-0 text-zinc-500">Fare</dt>
          <dd className="text-zinc-200">
            {formatUsd(flight.priceUsd)}{" "}
            <span className="text-zinc-600">/ guest · base fare</span>
          </dd>
        </div>
        {seatExtrasUsd > 0 ? (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-zinc-500">Seat extras</dt>
            <dd className="font-medium text-zinc-200">{formatUsd(seatExtrasUsd)}</dd>
          </div>
        ) : null}
        {seatSummary ? (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-zinc-500">Seats</dt>
            <dd className="text-zinc-200">
              {seatSummary}
              {seatsInfo.exitRow ? <span className="text-zinc-500"> · Exit row</span> : null}
              {seatsInfo.seatCabin === "business" &&
              (flight.cabinTier ?? "economy") !== "business" ? (
                <span className="text-zinc-500"> · Business cabin (upgrade)</span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {seatsInfo.bagsNotAllowedAtSeat ? (
        <div className="mt-4 rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-400 ring-1 ring-white/[0.06]">
          This seat requires clear floor space —{" "}
          <span className="text-zinc-200">bags can’t be kept at your seat</span> during
          taxi, takeoff, or landing.
        </div>
      ) : null}

      {showDestinationInsight ? (
        <div className="mt-4 space-y-2 rounded-xl border border-white/[0.10] bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 px-4 py-3 ring-1 ring-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
            {destInfo.headline}
          </p>
          <p className="text-[13px] leading-relaxed text-zinc-300">{destInfo.climate}</p>
          <p className="text-[12px] leading-relaxed text-zinc-500">{destInfo.tip}</p>
        </div>
      ) : null}
    </section>
  );
}
