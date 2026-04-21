"use client";

import { useMemo } from "react";
import { useBooking } from "@/context/BookingContext";
import type { Seat } from "@/types/booking";
import { buildSeatsForFlight, ROWS, totalSeatFees, WING_LO, WING_HI } from "@/lib/seats";
import { formatUsd } from "@/lib/money";

const ABC = ["A", "B", "C"] as const;
const DEF = ["D", "E", "F"] as const;

function bandIfNeeded(row: number): string | null {
  if (row === 1) return "Business · rows 1–6";
  if (row === 7) return "Economy";
  if (row === 14) return "Exit row · 14–15";
  if (row === 16) return "Standard pitch";
  return null;
}

export function SeatMap() {
  const { selectedFlight, selectedSeatIds, toggleSeat } = useBooking();

  const { byId, feeTotal } = useMemo(() => {
    if (!selectedFlight) {
      return { byId: {} as Record<string, Seat>, feeTotal: 0 };
    }
    const s = buildSeatsForFlight(selectedFlight.id);
    const b = Object.fromEntries(s.map((x) => [x.id, x])) as Record<
      string,
      Seat
    >;
    return {
      byId: b,
      feeTotal: totalSeatFees(selectedSeatIds, b),
    };
  }, [selectedFlight, selectedSeatIds]);

  if (!selectedFlight) return null;

  const selected = new Set(selectedSeatIds);

  return (
    <div className="space-y-4">
      <p className="text-center text-[13px] text-zinc-400">
        Tap a seat to select · tap again to remove ·{" "}
        <span className="text-zinc-300">
          add-ons {formatUsd(feeTotal)}
        </span>
      </p>

      <div className="mx-auto w-full max-w-[34rem] rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.05] sm:px-5">
        <Legend />
      </div>

      {/* Fuselage frame: centered so the map doesn’t hug the left edge */}
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-[30rem] rounded-[2rem] border border-white/[0.12] bg-gradient-to-b from-zinc-900/80 via-zinc-950/90 to-black/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_80px_-40px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.05] sm:p-6"
          role="group"
          aria-label="Aircraft seat map"
        >
          <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-600">
            Front · bulkhead
          </p>

          <div className="flex w-full justify-center overflow-x-auto">
            <div className="mx-auto inline-block min-w-[17.5rem] max-w-full">
              <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_2.25rem_1fr_1fr_1fr] gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <span className="text-[9px] text-zinc-600">⌁</span>
                <span>D</span>
                <span>E</span>
                <span>F</span>
              </div>

              <div className="flex flex-col gap-1">
                {Array.from({ length: ROWS }, (_, idx) => {
                  const row = idx + 1;
                  const band = bandIfNeeded(row);
                  return (
                    <div key={row}>
                      {band ? (
                        <div className="my-2 border-y border-white/[0.06] py-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                          {band}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-[1fr_1fr_1fr_2.25rem_1fr_1fr_1fr] items-center gap-1">
                        {ABC.map((letter) => (
                          <SeatButton
                            key={letter}
                            seatId={`${row}${letter}`}
                            seat={byId[`${row}${letter}`]}
                            selected={selected.has(`${row}${letter}`)}
                            onToggle={() => toggleSeat(`${row}${letter}`)}
                          />
                        ))}
                        <div
                          className={`flex h-10 items-center justify-center rounded border border-white/[0.06] text-[11px] font-mono text-zinc-500 ${
                            row >= WING_LO && row <= WING_HI
                              ? "bg-zinc-800/60"
                              : "bg-zinc-900/40"
                          }`}
                        >
                          {row}
                        </div>
                        {DEF.map((letter) => (
                          <SeatButton
                            key={letter}
                            seatId={`${row}${letter}`}
                            seat={byId[`${row}${letter}`]}
                            selected={selected.has(`${row}${letter}`)}
                            onToggle={() => toggleSeat(`${row}${letter}`)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-600">
            Rear · galley
          </p>
        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seatId,
  seat,
  selected,
  onToggle,
}: {
  seatId: string;
  seat: ReturnType<typeof buildSeatsForFlight>[0] | undefined;
  selected: boolean;
  onToggle: () => void;
}) {
  if (!seat) return <div />;

  const busy = seat.state !== "available";
  const letter = seatId.slice(-1);

  let cls =
    "flex h-10 items-center justify-center rounded-md border text-[12px] font-semibold transition active:scale-95 ";
  if (busy) {
    cls +=
      "cursor-not-allowed border-zinc-700 bg-zinc-800/80 text-zinc-600";
  } else if (selected) {
    cls +=
      "border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.5)] ring-2 ring-white/90 ring-offset-2 ring-offset-zinc-950";
  } else if (seat.category === "premium") {
    cls +=
      "border-violet-400/45 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25";
  } else if (seat.category === "extraLegroom") {
    cls +=
      "border-sky-400/45 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25";
  } else {
    cls +=
      "border-cyan-400/35 bg-cyan-500/10 text-cyan-50 hover:bg-cyan-500/20";
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onToggle}
      className={cls}
      aria-pressed={selected}
      aria-label={`Seat ${seatId}${busy ? ", unavailable" : selected ? ", selected" : ""}`}
    >
      {letter}
    </button>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-zinc-500">
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-cyan-400/35 bg-cyan-500/10" />{" "}
        Economy
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-violet-400/45 bg-violet-500/15" />{" "}
        Business
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-sky-400/45 bg-sky-500/15" />{" "}
        Extra legroom
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-zinc-700 bg-zinc-800/80" />{" "}
        Occupied / blocked
      </li>
    </ul>
  );
}
