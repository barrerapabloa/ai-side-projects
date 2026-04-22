"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CabinTier } from "@/types/booking";
import { getMockFlights } from "@/data/mockFlights";
import { formatUsd } from "@/lib/money";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";

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
  const { search, selectedFlight, selectedReturnFlight, setSelectedFlight, setSelectedReturnFlight } =
    useBooking();

  const [cabinFilter, setCabinFilter] = useState<CabinFilter>(() => {
    if (typeof window === "undefined") return "all";
    const params = new URLSearchParams(window.location.search);
    const cabin = params.get("cabin") as CabinFilter | null;
    return cabin && (cabin === "all" || cabin === "economy" || cabin === "business" || cabin === "first")
      ? cabin
      : "all";
  });
  const [sortKey, setSortKey] = useState<SortKey>("price");

  const ok = Boolean(
    search?.origin &&
      search.destination &&
      search.departDate &&
      (search.tripType !== "round-trip" || search.returnDate),
  );
  useRedirectUnless(ok, "/search");

  const pickingReturn = search?.tripType === "round-trip" && Boolean(selectedFlight) && !selectedReturnFlight;
  const rawFlights = useMemo(() => {
    if (!search) return [];
    if (pickingReturn) {
      return getMockFlights(
        search.destination,
        search.origin,
        search.returnDate ?? search.departDate,
      );
    }
    return getMockFlights(search.origin, search.destination, search.departDate);
  }, [search, pickingReturn]);

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

  const bestPriceUsd = useMemo(() => {
    if (flights.length === 0) return 0;
    return flights.reduce((min, f) => Math.min(min, f.priceUsd), Infinity);
  }, [flights]);

  const FILTERS: { key: CabinFilter; label: string }[] = [
    { key: "all", label: "All cabins" },
    { key: "economy", label: "Economy" },
    { key: "business", label: "Business" },
    { key: "first", label: "First" },
  ];
  const SORTS: { key: SortKey; label: string }[] = [
    { key: "price", label: "Lowest price" },
    { key: "duration", label: "Shortest" },
    { key: "depart", label: "Earliest" },
  ];

  return (
    search ? (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <StepHeading
            step="Step 2 · Flights"
            title={
              search.tripType === "round-trip"
                ? pickingReturn
                  ? "Choose your return flight"
                  : "Choose your outbound flight"
                : "Choose a flight"
            }
            subtitle={
              search.tripType === "round-trip"
                ? pickingReturn
                  ? "Pick a return option to complete your round trip."
                  : "Pick an outbound option, then you’ll choose your return."
                : "Tap a row to lock it in and continue."
            }
          />
          {search.tripType === "round-trip" && !pickingReturn ? (
            <p className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12px] text-zinc-300 ring-1 ring-white/[0.06]">
              Round trip: next you’ll pick the return leg.
            </p>
          ) : null}
          {search.tripType === "round-trip" && pickingReturn ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12px] text-zinc-300 ring-1 ring-white/[0.06]">
              <span>
                Outbound selected:{" "}
                <span className="font-semibold text-white">NMB {selectedFlight?.flightNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFlight(null);
                  setSelectedReturnFlight(null);
                }}
                className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
              >
                Change outbound
              </button>
            </div>
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
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {SORTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={
                  sortKey === key ? "bf-filter-pill-active" : "bf-filter-pill-idle"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {flights.length === 0 ? (
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-6 text-center text-sm text-zinc-400">
          No flights match this cabin filter — try{" "}
          <button
            type="button"
            onClick={() => setCabinFilter("all")}
            className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
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
                  if (search.tripType === "round-trip") {
                    if (!selectedFlight) {
                      setSelectedFlight(f);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      return;
                    }
                    setSelectedReturnFlight(f);
                    window.setTimeout(() => router.push("/fare"), 0);
                    return;
                  }
                  setSelectedFlight(f);
                  window.setTimeout(() => router.push("/fare"), 0);
                }}
                className="bf-interactive-surface group relative w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-b from-zinc-950/95 to-black/80 px-4 py-4 text-left shadow-[0_22px_70px_-52px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.06] hover:-translate-y-[1px] hover:border-white/[0.22] hover:ring-white/[0.10]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                >
                  <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-white/8 blur-2xl" />
                  <div className="absolute -right-16 -top-10 h-40 w-40 rounded-full bg-white/6 blur-2xl" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums text-[12px] font-medium text-zinc-200">
                        NMB {f.flightNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                          f.stopsLabel.startsWith("Nonstop")
                            ? "bg-emerald-500/12 text-emerald-200 ring-emerald-500/25"
                            : "bg-amber-500/10 text-amber-100 ring-amber-500/20"
                        }`}
                      >
                        {f.stopsLabel.startsWith("Nonstop") ? "Direct" : "1 stop"}
                      </span>
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300 ring-1 ring-white/[0.08]">
                        {f.durationLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tierBadgeClasses(
                          f.cabinTier ?? "economy",
                        )}`}
                      >
                        {f.fareLabel}
                      </span>
                      {bestPriceUsd > 0 && f.priceUsd === bestPriceUsd ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">
                          Best price
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid items-center gap-3 sm:grid-cols-[auto_1fr_auto]">
                      <div className="min-w-0">
                        <p className="tabular-nums text-[18px] font-semibold leading-none text-white">
                          {f.departLabel}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          {f.origin}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        <div className="flex items-center gap-3 text-zinc-600">
                          <span className="h-px flex-1 bg-white/[0.10]" />
                          <span className="text-[12px]" aria-hidden>
                            ✈
                          </span>
                          <span className="h-px flex-1 bg-white/[0.10]" />
                        </div>
                        <p className="mt-2 truncate text-[12px] text-zinc-500">
                          {f.aircraftType}
                        </p>
                      </div>

                      <div className="min-w-0 text-right">
                        <p className="tabular-nums text-[18px] font-semibold leading-none text-white">
                          {f.arriveLabel}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          {f.destination}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tabular-nums text-2xl font-semibold leading-none text-white">
                      {formatUsd(f.priceUsd)}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">per guest</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] text-zinc-500">{f.baggageIncluded}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-black shadow-lg shadow-black/40">
                    Select
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[13px] text-zinc-600">
        <Link
          href="/search"
          className="text-zinc-300 underline underline-offset-2 transition-colors duration-200 hover:text-white"
        >
          Edit search
        </Link>
      </p>
    </div>
    ) : null
  );
}
