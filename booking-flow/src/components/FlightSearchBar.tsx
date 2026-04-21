"use client";

import { useEffect, useRef, useState } from "react";
import type { TripType } from "@/types/booking";
import { AIRPORTS, airportLabel } from "@/data/airports";
import { FlightRangeCalendar } from "@/components/FlightRangeCalendar";
import { parseIsoDate } from "@/lib/datetime";

function formatPillDates(
  tripType: TripType,
  departIso: string,
  returnIso: string | null,
): string {
  const dep = parseIsoDate(departIso);
  const mo = dep.toLocaleDateString("en-US", { month: "short" });
  const depDay = dep.getDate();
  const depY = dep.getFullYear();

  if (tripType === "one-way") {
    return `${mo} ${depDay}${dep.getFullYear() !== new Date().getFullYear() ? `, ${depY}` : ""}`;
  }

  if (!returnIso || returnIso <= departIso) {
    return `${mo} ${depDay} — Select return`;
  }

  const ret = parseIsoDate(returnIso);
  const rMo = ret.toLocaleDateString("en-US", { month: "short" });
  const rDay = ret.getDate();
  const rY = ret.getFullYear();

  if (
    dep.getMonth() === ret.getMonth() &&
    dep.getFullYear() === ret.getFullYear()
  ) {
    return `${mo} ${depDay} – ${rDay}, ${depY}`;
  }

  return `${mo} ${depDay} – ${rMo} ${rDay}${rY !== depY ? `, ${rY}` : ""}`;
}

type FlightSearchBarProps = {
  tripType: TripType;
  onTripTypeChange: (t: TripType) => void;
  origin: string;
  destination: string;
  onOriginChange: (code: string) => void;
  onDestinationChange: (code: string) => void;
  departDate: string;
  returnDate: string | null;
  onDepartChange: (iso: string) => void;
  onReturnChange: (iso: string | null) => void;
  passengers: number;
  onPassengersChange: (n: number) => void;
  minDate: string;
  onResetDates: () => void;
  invalidRoute: boolean;
};

export function FlightSearchBar({
  tripType,
  onTripTypeChange,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  departDate,
  returnDate,
  onDepartChange,
  onReturnChange,
  passengers,
  onPassengersChange,
  minDate,
  onResetDates,
  invalidRoute,
}: FlightSearchBarProps) {
  const [open, setOpen] = useState<null | "where" | "when" | "who">(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const whereSummary = `${airportLabel(origin)} → ${airportLabel(destination)}`;
  const whenSummary = formatPillDates(tripType, departDate, returnDate);
  const whoSummary =
    passengers === 1 ? "1 traveler" : `${passengers} travelers`;

  function swapEndpoints() {
    const o = origin;
    onOriginChange(destination);
    onDestinationChange(o);
  }

  return (
    <div ref={rootRef} className="relative z-10 w-full space-y-5">
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="text-[13px] font-medium text-zinc-400">Trip type</span>
        <div
          role="radiogroup"
          aria-label="Trip type"
          className="flex w-full max-w-md rounded-2xl border border-white/[0.12] bg-black/50 p-1 ring-1 ring-white/[0.06] sm:ml-auto sm:w-auto"
        >
          <button
            type="button"
            role="radio"
            aria-checked={tripType === "one-way"}
            onClick={() => onTripTypeChange("one-way")}
            className={`min-h-11 flex-1 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition sm:min-w-[9.5rem] ${
              tripType === "one-way"
                ? "bg-white text-black shadow-lg shadow-black/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            One-way
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tripType === "round-trip"}
            onClick={() => onTripTypeChange("round-trip")}
            className={`min-h-11 flex-1 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition sm:min-w-[9.5rem] ${
              tripType === "round-trip"
                ? "bg-white text-black shadow-lg shadow-black/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Round trip
          </button>
        </div>
      </div>

      <div
        className="flex flex-col divide-y divide-white/[0.08] rounded-[2rem] border border-white/[0.12] bg-zinc-950/90 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06] lg:flex-row lg:divide-x lg:divide-y-0"
      >
        <button
          type="button"
          onClick={() => setOpen(open === "where" ? null : "where")}
          className={`group flex flex-1 flex-col gap-0.5 rounded-[2rem] px-6 py-4 text-left transition lg:rounded-none lg:rounded-l-[2rem] lg:py-3.5 ${
            open === "where"
              ? "bg-white/[0.06]"
              : "hover:bg-white/[0.04]"
          }`}
        >
          <span className="text-[11px] font-semibold tracking-wide text-zinc-400">
            Where
          </span>
          <span className="truncate text-[15px] text-zinc-200">{whereSummary}</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen(open === "when" ? null : "when")}
          className={`group flex flex-1 flex-col gap-0.5 px-6 py-4 text-left transition lg:py-3.5 ${
            open === "when" ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
          }`}
        >
          <span className="text-[11px] font-semibold tracking-wide text-zinc-400">
            When
          </span>
          <span className="truncate text-[15px] text-zinc-200">{whenSummary}</span>
        </button>

        <div className="flex flex-1 items-stretch lg:min-w-0">
          <button
            type="button"
            onClick={() => setOpen(open === "who" ? null : "who")}
            className={`group flex min-w-0 flex-1 flex-col gap-0.5 px-6 py-4 text-left transition lg:py-3.5 ${
              open === "who" ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-[11px] font-semibold tracking-wide text-zinc-400">
              Who
            </span>
            <span className="truncate text-[15px] text-zinc-200">{whoSummary}</span>
          </button>

          <div className="flex shrink-0 items-center pr-3 py-3 lg:pr-4">
            <button
              type="submit"
              disabled={invalidRoute}
              aria-label="Search flights"
              className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/40 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {invalidRoute ? (
        <p className="mt-3 text-[13px] text-amber-400/90">
          Origin and destination must differ.
        </p>
      ) : null}

      {/* Where */}
      {open === "where" ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 max-h-[min(70vh,520px)] overflow-auto rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.08] lg:left-0 lg:right-auto lg:w-[400px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-white">Route</p>
              <button
                type="button"
                onClick={swapEndpoints}
                className="rounded-full border border-white/[0.12] px-3 py-1 text-[12px] font-medium text-zinc-300 hover:bg-white/[0.06]"
              >
                Swap
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-zinc-500">From</span>
              <select
                value={origin}
                onChange={(e) => onOriginChange(e.target.value)}
                className="bf-select w-full"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-zinc-500">To</span>
              <select
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="bf-select w-full"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {/* When */}
      {open === "when" ? (
        <div className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(100vw-2rem,920px)] max-h-[min(85vh,720px)] -translate-x-1/2 overflow-auto rounded-2xl border border-white/[0.1] bg-[#07080a] p-3 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06] lg:left-0 lg:w-[min(100%,920px)] lg:max-w-[920px] lg:translate-x-0">
          <FlightRangeCalendar
            surface="dark"
            showTripTypeSelector={false}
            compactChrome
            tripType={tripType}
            onTripTypeChange={onTripTypeChange}
            origin={origin}
            destination={destination}
            departDate={departDate}
            returnDate={tripType === "round-trip" ? returnDate : null}
            onDepartChange={onDepartChange}
            onReturnChange={onReturnChange}
            minDate={minDate}
            onResetDates={onResetDates}
          />
        </div>
      ) : null}

      {/* Who */}
      {open === "who" ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(100%,340px)] rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.08]">
          <p className="text-[13px] font-semibold text-white">Travelers</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-400">Guests</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer travelers"
                onClick={() =>
                  onPassengersChange(Math.max(1, passengers - 1))
                }
                className="flex size-10 items-center justify-center rounded-full border border-white/[0.12] text-lg font-medium text-zinc-300 hover:bg-white/[0.06]"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center text-lg font-semibold tabular-nums text-white">
                {passengers}
              </span>
              <button
                type="button"
                aria-label="More travelers"
                onClick={() =>
                  onPassengersChange(Math.min(9, passengers + 1))
                }
                className="flex size-10 items-center justify-center rounded-full border border-white/[0.12] text-lg font-medium text-zinc-300 hover:bg-white/[0.06]"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
            Up to nine travelers per booking.
          </p>
        </div>
      ) : null}
    </div>
  );
}
