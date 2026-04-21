"use client";

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
  /** Seat fees so far (optional). */
  seatExtrasUsd?: number;
  /** Comma-separated seat ids for display */
  seatSummary?: string;
  variant?: "default" | "compact";
};

export function TripSummaryCard({
  search,
  flight,
  seatExtrasUsd = 0,
  seatSummary,
  variant = "default",
}: TripSummaryCardProps) {
  const compact = variant === "compact";
  const destInfo = getDestinationInsight(search.destination);

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
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300/95 ring-1 ring-emerald-500/25">
            {flight.stopsLabel}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${cabinTierBadge(flight.cabinTier)}`}
          >
            {flight.fareLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/[0.06]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Departs
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
            {flight.departLabel}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">{search.origin}</p>
        </div>
        <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/[0.06]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Arrives
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
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
          <dd className="font-mono text-zinc-200">
            NMB {flight.flightNumber}
          </dd>
        </div>
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
            <dd className="font-medium text-amber-200/95">{formatUsd(seatExtrasUsd)}</dd>
          </div>
        ) : null}
        {seatSummary ? (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-zinc-500">Seats</dt>
            <dd className="font-mono text-zinc-200">{seatSummary}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 space-y-2 rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/40 to-zinc-950/60 px-4 py-3 ring-1 ring-indigo-500/15">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200/90">
          {destInfo.headline}
        </p>
        <p className="text-[13px] leading-relaxed text-zinc-300">{destInfo.climate}</p>
        <p className="text-[12px] leading-relaxed text-zinc-500">{destInfo.tip}</p>
      </div>
    </section>
  );
}
