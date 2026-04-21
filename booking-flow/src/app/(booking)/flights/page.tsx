"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CabinTier } from "@/types/booking";
import { airportLabel } from "@/data/airports";
import { getMockFlights } from "@/data/mockFlights";
import { formatTripDate } from "@/lib/datetime";
import { formatUsd } from "@/lib/money";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

type CabinFilter = "all" | CabinTier;
type SortKey = "price" | "duration" | "depart";

function parseDurationMinutes(s: string): number {
  const m = s.match(/(\d+)\s*h\s*(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]!, 10) * 60 + parseInt(m[2]!, 10);
}

function parseDepartMinutes(label: string): number {
  const m = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  const ap = m[3]!.toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function tierBadgeClasses(tier: CabinTier): string {
  switch (tier) {
    case "economy":
      return "border-white/[0.1] bg-white/[0.06] text-zinc-300 ring-white/[0.08]";
    case "business":
      return "border-violet-400/35 bg-violet-500/15 text-violet-100 ring-violet-400/25";
    case "first":
      return "border-amber-400/40 bg-amber-500/15 text-amber-100 ring-amber-400/25";
    default:
      return "border-white/[0.1] bg-white/[0.06] text-zinc-300";
  }
}

export default function FlightsPage() {
  const router = useRouter();
  const { search, setSelectedFlight } = useBooking();

  const [cabinFilter, setCabinFilter] = useState<CabinFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("price");

  const ok = Boolean(search?.origin && search.destination && search.departDate);
  useRedirectUnless(ok, "/search");

  const rawFlights = useMemo(() => {
    if (!search) return [];
    return getMockFlights(search.origin, search.destination, search.departDate);
  }, [search]);

  const flights = useMemo(() => {
    const list =
      cabinFilter === "all"
        ? [...rawFlights]
        : rawFlights.filter(
            (f) => (f.cabinTier ?? "economy") === cabinFilter,
          );

    list.sort((a, b) => {
      if (sortKey === "price") return a.priceUsd - b.priceUsd;
      if (sortKey === "duration")
        return parseDurationMinutes(a.durationLabel) - parseDurationMinutes(b.durationLabel);
      return parseDepartMinutes(a.departLabel) - parseDepartMinutes(b.departLabel);
    });

    return list;
  }, [rawFlights, cabinFilter, sortKey]);

  if (!search) return null;

  const FILTERS: { key: CabinFilter; label: string }[] = [
    { key: "all", label: "All cabins" },
    { key: "economy", label: "Economy" },
    { key: "business", label: "Business" },
    { key: "first", label: "First" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {search.tripType === "round-trip"
              ? "Choose your outbound flight"
              : "Choose a flight"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {airportLabel(search.origin)} → {airportLabel(search.destination)} ·{" "}
            <span className="text-zinc-400">{formatTripDate(search.departDate)}</span>
            {search.tripType === "round-trip" && search.returnDate ? (
              <>
                {" "}
                · Return {formatTripDate(search.returnDate)}
              </>
            ) : null}{" "}
            · {search.passengers}{" "}
            {search.passengers === 1 ? "traveler" : "travelers"}
          </p>
          {search.tripType === "round-trip" ? (
            <p className="mt-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[12px] text-indigo-100/90 ring-1 ring-indigo-500/15">
              Outbound flight only here — your return date still shapes timing and pricing context.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCabinFilter(key)}
                className={
                  cabinFilter === key ? "bf-filter-pill-active" : "bf-filter-pill-idle"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex flex-wrap items-center gap-2 sm:gap-3 text-[13px] text-zinc-400">
            <span className="sr-only">Sort flights</span>
            <span className="hidden shrink-0 sm:inline">Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bf-select min-w-0 shrink sm:min-w-[13.5rem]"
            >
              <option value="price">Lowest price</option>
              <option value="duration">Shortest flight</option>
              <option value="depart">Earliest departure</option>
            </select>
          </label>
        </div>
      </div>

      {flights.length === 0 ? (
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-6 text-center text-sm text-zinc-400">
          No flights match this cabin filter — try{" "}
          <button
            type="button"
            onClick={() => setCabinFilter("all")}
            className="font-medium text-sky-400 underline underline-offset-2 hover:text-sky-300"
          >
            All cabins
          </button>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {flights.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedFlight(f);
                  window.setTimeout(() => router.push("/seats"), 0);
                }}
                className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-zinc-950/95 via-zinc-950/75 to-black/70 px-5 py-5 text-left shadow-[0_22px_70px_-48px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.06] transition hover:-translate-y-[1px] hover:border-white/[0.2] hover:ring-white/[0.1]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                >
                  <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-sky-500/10 blur-2xl" />
                  <div className="absolute -right-16 -top-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-2xl" />
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] font-medium text-white">
                        NMB {f.flightNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                          f.stopsLabel.startsWith("Nonstop")
                            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                            : "bg-amber-500/12 text-amber-100 ring-amber-500/25"
                        }`}
                      >
                        {f.stopsLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tierBadgeClasses(f.cabinTier ?? "economy")}`}
                      >
                        {f.fareLabel}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-500">{f.aircraftType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums text-white">
                      {formatUsd(f.priceUsd)}
                    </p>
                    <p className="text-[12px] text-zinc-500">per guest · base fare</p>
                  </div>
                </div>

                <div className="relative mt-5 grid gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/[0.06]">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Depart
                    </p>
                    <p className="mt-1 font-mono text-lg text-zinc-100">
                      {f.departLabel}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/[0.06]">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Arrive
                    </p>
                    <p className="mt-1 font-mono text-lg text-zinc-100">
                      {f.arriveLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">{f.arriveDaySummary}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/[0.06]">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Duration
                    </p>
                    <p className="mt-1 text-lg text-zinc-200">{f.durationLabel}</p>
                  </div>
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
                  {f.baggageIncluded}
                </p>

                <p className="mt-4 text-[13px] font-medium text-zinc-500 transition group-hover:text-sky-300/90">
                  Select this flight →
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[13px] text-zinc-600">
        <Link href="/search" className="text-zinc-400 underline underline-offset-2">
          Edit search
        </Link>
      </p>
    </div>
  );
}
