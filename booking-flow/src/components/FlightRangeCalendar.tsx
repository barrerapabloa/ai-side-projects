"use client";

import { useMemo, useState } from "react";
import type { TripType } from "@/types/booking";
import {
  addDaysIso,
  daysInMonth,
  formatIsoDate,
  formatShortDate,
  parseIsoDate,
} from "@/lib/datetime";
import { getSyntheticDayFare } from "@/lib/mockFareCalendar";
import { formatUsd } from "@/lib/money";

const WEEK_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type FlightRangeCalendarProps = {
  /** Light surface for use on white hero / popovers (default dark). */
  surface?: "dark" | "light";
  /** When false, hide the trip-type `<select>` (e.g. controlled elsewhere). Default true. */
  showTripTypeSelector?: boolean;
  /** Hide Out/Back chips + top Reset; move Reset to footer (embed in search popover). */
  compactChrome?: boolean;
  /**
   * When true, don't render the calendar's outer rounded/border shell.
   * Use when the calendar already sits inside a rounded modal/panel.
   */
  embedded?: boolean;
  tripType: TripType;
  onTripTypeChange: (t: TripType) => void;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string | null;
  onDepartChange: (iso: string) => void;
  onReturnChange: (iso: string | null) => void;
  onResetDates: () => void;
  minDate: string;
};

function calendarSkin(surface: "dark" | "light") {
  const L = surface === "light";
  return {
    outer: L
      ? "rounded-2xl border border-zinc-200 bg-white shadow-sm"
      : "rounded-2xl border border-white/[0.1] bg-gradient-to-b from-zinc-900 to-zinc-950",
    headerBorder: L ? "border-zinc-100" : "border-white/[0.06]",
    tripSelect: L ? "bf-select-compact-light" : "bf-select-compact-dark",
    chipWrap: L
      ? "rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[13px] text-zinc-700"
      : "rounded-lg border border-white/[0.08] bg-zinc-950/90 px-2 py-1.5 text-zinc-300",
    chipMuted: L ? "text-zinc-500" : "text-zinc-500",
    chipStrong: L ? "font-medium text-zinc-900" : "font-medium text-white",
    chipBtn: L
      ? "rounded px-0.5 text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-900"
      : "rounded px-0.5 text-zinc-500 hover:bg-white/[0.08] hover:text-white",
    resetBtn: L
      ? "text-[13px] font-medium text-zinc-800 hover:text-zinc-950"
      : "text-[13px] font-medium text-zinc-200 hover:text-white",
    navRowBorder: L ? "border-zinc-100" : "border-white/[0.04]",
    navBtn: L
      ? "shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50"
      : "shrink-0 rounded-lg border border-white/[0.12] px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
    monthTitle: L ? "text-[13px] font-semibold text-zinc-900" : "text-[13px] font-semibold text-white",
    footerBorder: L ? "border-zinc-100" : "border-white/[0.06]",
    footerHint: L ? "text-[11px] text-zinc-500" : "text-[11px] text-zinc-500",
    footerPrice: L ? "text-[12px] text-emerald-700" : "text-[12px] text-emerald-400",
    selectReturn: L ? "text-zinc-500" : "text-zinc-500",
  };
}

function monthPair(leftY: number, leftM: number) {
  if (leftM === 11) return { ry: leftY + 1, rm: 0 };
  return { ry: leftY, rm: leftM + 1 };
}

function prevMonthCursor(y: number, m: number) {
  if (m === 0) return { y: y - 1, m: 11 };
  return { y, m: m - 1 };
}

function nextMonthCursor(y: number, m: number) {
  if (m === 11) return { y: y + 1, m: 0 };
  return { y, m: m + 1 };
}

function buildMonthCells(year: number, monthIndex: number) {
  const dim = daysInMonth(year, monthIndex);
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const list: ({ iso: string } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) list.push(null);
  for (let day = 1; day <= dim; day++) {
    list.push({ iso: formatIsoDate(new Date(year, monthIndex, day)) });
  }
  return list;
}

function scanMonthOutbound(
  y: number,
  m: number,
  minDate: string,
  origin: string,
  destination: string,
): { minUsd: number; byIso: Map<string, number> } {
  const byIso = new Map<string, number>();
  let minUsd = Infinity;
  const dim = daysInMonth(y, m);
  for (let day = 1; day <= dim; day++) {
    const iso = formatIsoDate(new Date(y, m, day));
    if (iso < minDate) continue;
    const { usd } = getSyntheticDayFare(origin, destination, iso);
    byIso.set(iso, usd);
    minUsd = Math.min(minUsd, usd);
  }
  return { minUsd: minUsd === Infinity ? 0 : minUsd, byIso };
}

export function FlightRangeCalendar({
  surface = "dark",
  showTripTypeSelector = true,
  compactChrome = false,
  embedded = false,
  tripType,
  onTripTypeChange,
  origin,
  destination,
  departDate,
  returnDate,
  onDepartChange,
  onReturnChange,
  onResetDates,
  minDate,
}: FlightRangeCalendarProps) {
  const showTwoMonths = !compactChrome;
  const sk = calendarSkin(surface);
  const hideTopBar = compactChrome && !showTripTypeSelector;
  const initial = parseIsoDate(departDate);
  const [cursor, setCursor] = useState(() => ({
    y: initial.getFullYear(),
    m: initial.getMonth(),
  }));

  const minD = parseIsoDate(minDate);
  const canPrev = useMemo(() => {
    const curFirst = new Date(cursor.y, cursor.m, 1);
    const minFirst = new Date(minD.getFullYear(), minD.getMonth(), 1);
    return curFirst.getTime() > minFirst.getTime();
  }, [cursor.y, cursor.m, minD]);
  const right = monthPair(cursor.y, cursor.m);

  const leftLabel = useMemo(
    () =>
      new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [cursor.y, cursor.m],
  );

  const rightLabel = useMemo(
    () =>
      new Date(right.ry, right.rm, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [right.ry, right.rm],
  );

  const cheapestOutboundSet = useMemo(() => {
    const rp = monthPair(cursor.y, cursor.m);
    const leftScan = scanMonthOutbound(cursor.y, cursor.m, minDate, origin, destination);
    const rightScan = scanMonthOutbound(rp.ry, rp.rm, minDate, origin, destination);
    const globalMin = Math.min(
      leftScan.minUsd === 0 ? Infinity : leftScan.minUsd,
      rightScan.minUsd === 0 ? Infinity : rightScan.minUsd,
    );
    if (!Number.isFinite(globalMin) || globalMin === Infinity) return new Set<string>();
    const set = new Set<string>();
    for (const [iso, usd] of leftScan.byIso) {
      if (usd === globalMin) set.add(iso);
    }
    for (const [iso, usd] of rightScan.byIso) {
      if (usd === globalMin) set.add(iso);
    }
    return set;
  }, [cursor.y, cursor.m, minDate, origin, destination]);

  function onDayClick(iso: string) {
    const d = parseIsoDate(iso);
    if (d < minD) return;

    if (tripType === "one-way") {
      onDepartChange(iso);
      return;
    }

    if (!returnDate) {
      if (iso < departDate) {
        onDepartChange(iso);
      } else if (iso > departDate) {
        onReturnChange(iso);
      }
      return;
    }

    onDepartChange(iso);
    onReturnChange(null);
  }

  const totalEstimate =
    tripType === "round-trip" && returnDate && returnDate > departDate
      ? getSyntheticDayFare(origin, destination, departDate).usd +
        getSyntheticDayFare(destination, origin, returnDate).usd
      : getSyntheticDayFare(origin, destination, departDate).usd;

  const tripDays =
    tripType === "round-trip" && returnDate && returnDate > departDate
      ? Math.round(
          (parseIsoDate(returnDate).getTime() - parseIsoDate(departDate).getTime()) /
            86400000,
        )
      : null;

  function shiftDepart(delta: number) {
    let next = addDaysIso(departDate, delta);
    if (next < minDate) next = minDate;
    onDepartChange(next);
    if (tripType === "round-trip" && returnDate && returnDate <= next) {
      onReturnChange(addDaysIso(next, 1));
    }
  }

  function shiftReturn(delta: number) {
    if (!returnDate || tripType !== "round-trip") return;
    const floor = addDaysIso(departDate, 1);
    let next = addDaysIso(returnDate, delta);
    if (next < floor) next = floor;
    onReturnChange(next);
  }

  return (
    <div
      className={`overflow-hidden ${
        embedded
          ? surface === "light"
            ? "bg-white"
            : "bg-transparent"
          : sk.outer
      }`}
    >
      {!hideTopBar ? (
        <div
          className={`flex flex-wrap items-center gap-3 border-b px-3 py-2.5 ${sk.headerBorder} ${
            compactChrome && showTripTypeSelector
              ? "justify-start"
              : showTripTypeSelector
                ? "justify-between"
                : "justify-end"
          }`}
        >
          {showTripTypeSelector ? (
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="trip-type-cal">
                Trip type
              </label>
              <select
                id="trip-type-cal"
                value={tripType}
                onChange={(e) =>
                  onTripTypeChange(e.target.value === "round-trip" ? "round-trip" : "one-way")
                }
                className={sk.tripSelect}
              >
                <option value="round-trip">Round trip</option>
                <option value="one-way">One-way</option>
              </select>
            </div>
          ) : null}

          {!compactChrome ? (
            <div className="flex flex-wrap items-center justify-end gap-3 sm:flex-1">
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-[13px]">
                <span className={sk.chipWrap}>
                  <span className={sk.chipMuted}>Out</span>{" "}
                  <span className={sk.chipStrong}>
                    {formatShortDate(parseIsoDate(departDate))}
                  </span>
                  <span className="inline-flex gap-0.5 pl-1">
                    <button
                      type="button"
                      aria-label="Move departure earlier"
                      onClick={() => shiftDepart(-1)}
                      className={sk.chipBtn}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Move departure later"
                      onClick={() => shiftDepart(1)}
                      className={sk.chipBtn}
                    >
                      ›
                    </button>
                  </span>
                </span>

                {tripType === "round-trip" ? (
                  <span className={sk.chipWrap}>
                    <span className={sk.chipMuted}>Back</span>{" "}
                    {returnDate ? (
                      <>
                        <span className={sk.chipStrong}>
                          {formatShortDate(parseIsoDate(returnDate))}
                        </span>
                        <span className="inline-flex gap-0.5 pl-1">
                          <button
                            type="button"
                            aria-label="Move return earlier"
                            onClick={() => shiftReturn(-1)}
                            className={sk.chipBtn}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            aria-label="Move return later"
                            onClick={() => shiftReturn(1)}
                            className={sk.chipBtn}
                          >
                            ›
                          </button>
                        </span>
                      </>
                    ) : (
                      <span className={sk.selectReturn}>Select return</span>
                    )}
                  </span>
                ) : null}
              </div>

              <button type="button" onClick={onResetDates} className={sk.resetBtn}>
                Reset
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`border-b px-3 pt-2 ${compactChrome ? "pb-2" : "pb-3"} ${sk.navRowBorder}`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => prevMonthCursor(c.y, c.m))}
            className={sk.navBtn}
            aria-label="Previous months"
            disabled={!canPrev}
          >
            ‹
          </button>
          <div
            className={`flex min-w-0 flex-1 justify-center gap-6 text-[13px] font-semibold sm:gap-16 ${sk.monthTitle}`}
          >
            <span className="truncate text-center">{leftLabel}</span>
            {showTwoMonths ? (
              <span className="truncate text-center">{rightLabel}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setCursor((c) => nextMonthCursor(c.y, c.m))}
            className={sk.navBtn}
            aria-label="Next months"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-3 lg:flex-row lg:gap-6">
        <MonthGrid
          surface={surface}
          year={cursor.y}
          monthIndex={cursor.m}
          tripType={tripType}
          origin={origin}
          destination={destination}
          departDate={departDate}
          returnDate={returnDate}
          minDate={minDate}
          cheapestOutboundSet={cheapestOutboundSet}
          onDayClick={onDayClick}
        />
        {showTwoMonths ? (
          <MonthGrid
            surface={surface}
            year={right.ry}
            monthIndex={right.rm}
            tripType={tripType}
            origin={origin}
            destination={destination}
            departDate={departDate}
            returnDate={returnDate}
            minDate={minDate}
            cheapestOutboundSet={cheapestOutboundSet}
            onDayClick={onDayClick}
          />
        ) : null}
      </div>

      <div
        className={`flex flex-col border-t px-3 sm:flex-row sm:items-center sm:justify-between ${compactChrome ? "gap-2 py-2" : "gap-3 py-3"} ${sk.footerBorder}`}
      >
        <p className={`${sk.footerHint} min-w-0 flex-1`}>
          Synthetic fares for comparison — lowest outbound fares in view are{" "}
          <span className={surface === "light" ? "text-emerald-600" : "text-emerald-400"}>
            highlighted
          </span>
          .
          {tripDays != null ? (
            <>
              {" "}
              Trip length{" "}
              <span
                className={surface === "light" ? "text-zinc-600" : "text-zinc-400"}
              >
                {tripDays} days
              </span>
              .
            </>
          ) : null}
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-2">
          {hideTopBar ? (
            <button type="button" onClick={onResetDates} className={sk.resetBtn}>
              Reset dates
            </button>
          ) : null}
          <p className={sk.footerPrice}>
            From {formatUsd(totalEstimate)}{" "}
            {tripType === "round-trip" ? "estimated round trip" : "estimated one-way"}
          </p>
        </div>
      </div>
    </div>
  );
}

type MonthGridProps = {
  surface: "dark" | "light";
  year: number;
  monthIndex: number;
  tripType: TripType;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string | null;
  minDate: string;
  cheapestOutboundSet: Set<string>;
  onDayClick: (iso: string) => void;
};

function MonthGrid({
  surface,
  year,
  monthIndex,
  tripType,
  origin,
  destination,
  departDate,
  returnDate,
  minDate,
  cheapestOutboundSet,
  onDayClick,
}: MonthGridProps) {
  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);
  const minD = parseIsoDate(minDate);
  const L = surface === "light";

  return (
    <div className="min-w-0 flex-1">
      <div
        className={`grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium ${
          L ? "text-zinc-500" : "text-zinc-500"
        }`}
      >
        {WEEK_LETTERS.map((letter, i) => (
          <span key={`${letter}-${i}`} className="py-1.5">
            {letter}
          </span>
        ))}
      </div>

      <div
        className={`mt-2 grid grid-cols-7 gap-px rounded-xl bg-white/[0.06] p-px ${
          L ? "bg-zinc-200" : "bg-white/[0.06]"
        }`}
      >
        {cells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`pad-${idx}`}
                className="h-[64px] rounded-lg bg-transparent"
              />
            );
          }
          const { iso } = cell;
          const d = parseIsoDate(iso);
          const disabled = d < minD;
          const outbound = getSyntheticDayFare(origin, destination, iso);
          const inbound = getSyntheticDayFare(destination, origin, iso);
          const displayUsd =
            tripType === "round-trip" && returnDate && iso === returnDate
              ? inbound.usd
              : outbound.usd;

          const inRange =
            tripType === "round-trip" &&
            returnDate &&
            iso >= departDate &&
            iso <= returnDate;
          const isStart = iso === departDate;
          const isEnd = tripType === "round-trip" && returnDate != null && iso === returnDate;
          const isLow = !disabled && cheapestOutboundSet.has(iso);

          let cellBg = "bg-transparent";
          if (!disabled && inRange && !isStart && !isEnd)
            cellBg = L ? "bg-zinc-900/10" : "bg-white/[0.04]";
          if (!disabled && inRange && (isStart || isEnd))
            cellBg = L ? "bg-zinc-900/8" : "bg-white/[0.07]";

          const dayIsStartBubble =
            isStart || (tripType === "one-way" && iso === departDate);

          const startBubble = L
            ? "rounded-full bg-zinc-950 text-white shadow-md shadow-black/15"
            : "rounded-full bg-transparent text-white";
          const endBubble = L
            ? "rounded-full bg-white text-zinc-900 ring-1 ring-zinc-900/30"
            : "rounded-full bg-transparent text-white";
          const dayMuted = L ? "text-zinc-900" : "text-white";
          const priceLow = L ? "font-medium text-emerald-600" : "font-medium text-emerald-400";
          const priceOther = L ? "text-zinc-500" : "text-zinc-400";

          const baseCell = L ? "bg-white text-zinc-900" : "bg-[#0b0c10] text-white";
          const hoverable = disabled
            ? ""
            : L
              ? "hover:bg-zinc-50"
              : "hover:bg-white/[0.04]";

          // Stroke around the whole date field without overlapping neighbors.
          const activeFieldStroke = L
            ? "shadow-[0_0_0_2px_rgba(9,9,11,0.55)]"
            : "shadow-[0_0_0_2px_rgba(255,255,255,0.70)]";

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onDayClick(iso)}
              className={`relative flex h-[64px] flex-col items-center justify-center rounded-lg border border-transparent text-center transition-[background-color,transform,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-30 ${baseCell} ${hoverable} ${cellBg} ${
                !disabled && (dayIsStartBubble || isEnd) ? activeFieldStroke : ""
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25`}
            >
              <span
                className={`flex size-7 items-center justify-center text-[12px] font-semibold leading-none ${
                  dayIsStartBubble ? startBubble : isEnd ? endBubble : dayMuted
                }`}
              >
                {d.getDate()}
              </span>
              {!disabled ? (
                <span
                  className={`mt-0.5 tabular-nums text-[9px] leading-none ${
                    isLow ? priceLow : priceOther
                  }`}
                >
                  {formatUsd(displayUsd)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
