"use client";

import { useMemo } from "react";
import type { Seat } from "@/types/booking";
import type { Flight } from "@/types/booking";
import { buildSeatsForFlight, ROWS } from "@/lib/seats";

const ABC = ["A", "B", "C"] as const;
const DEF = ["D", "E", "F"] as const;

function WindowIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={props.className}
    >
      <path
        d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M9 7h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M9 11h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M9 15h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function bandIfNeeded(row: number): string | null {
  if (row === 1) return "Business · rows 1–6";
  if (row === 7) return "Economy";
  if (row === 14) return "Exit row · 14–15";
  if (row === 16) return "Standard pitch";
  return null;
}

export function SeatMap({
  flight,
  selectedSeatIds,
  onToggleSeat,
}: {
  flight: Flight;
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
}) {

  const { byId } = useMemo(() => {
    const s = buildSeatsForFlight(flight.id, flight.cabinTier);
    const b = Object.fromEntries(s.map((x) => [x.id, x])) as Record<
      string,
      Seat
    >;
    return {
      byId: b,
    };
  }, [flight.id, flight.cabinTier]);

  const selected = new Set(selectedSeatIds);
  const startRow = 1;
  const visibleRows = ROWS;

  return (
    <div className="space-y-4">
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
              {/* Column letters (icons live outside seats on edges) */}
              <div className="mb-2 grid grid-cols-[1.25rem_1fr_1fr_1fr_2.25rem_1fr_1fr_1fr_1.25rem] gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                <span />
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <span className="text-[9px] text-zinc-600">⌁</span>
                <span>D</span>
                <span>E</span>
                <span>F</span>
                <span />
              </div>

              <div className="flex flex-col gap-1">
                {Array.from({ length: visibleRows }, (_, idx) => {
                  const row = startRow + idx;
                  const band = bandIfNeeded(row);
                  return (
                    <div key={row}>
                      {band ? (
                        <div className="my-2 border-y border-white/[0.06] py-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                          {band}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-[1.25rem_1fr_1fr_1fr_2.25rem_1fr_1fr_1fr_1.25rem] items-center gap-1">
                        <div className="flex h-10 items-center justify-center text-white/55" aria-hidden>
                          <WindowIcon className="size-3.5" />
                        </div>
                        {ABC.map((letter) => (
                          <SeatButton
                            key={letter}
                            seatId={`${row}${letter}`}
                            seat={byId[`${row}${letter}`]}
                            selected={selected.has(`${row}${letter}`)}
                            onToggle={() => onToggleSeat(`${row}${letter}`)}
                          />
                        ))}
                        <div className="flex h-10 items-center justify-center rounded border border-white/[0.06] bg-zinc-900/40 text-[11px] tabular-nums text-zinc-500">
                          {row}
                        </div>
                        {DEF.map((letter) => (
                          <SeatButton
                            key={letter}
                            seatId={`${row}${letter}`}
                            seat={byId[`${row}${letter}`]}
                            selected={selected.has(`${row}${letter}`)}
                            onToggle={() => onToggleSeat(`${row}${letter}`)}
                          />
                        ))}
                        <div className="flex h-10 items-center justify-center text-white/55" aria-hidden>
                          <WindowIcon className="size-3.5" />
                        </div>
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
  const isWindow = letter === "A" || letter === "F";

  let cls =
    "relative flex h-10 items-center justify-center rounded-md border text-[12px] font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out active:scale-95 ";
  if (busy) {
    cls +=
      "cursor-not-allowed border-zinc-700 bg-zinc-800/80 text-zinc-600";
  } else if (selected) {
    cls +=
      "border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.35)] ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950";
  } else if (seat.category === "premium") {
    cls +=
      "border-violet-400/40 bg-violet-500/12 text-violet-50 hover:bg-violet-500/18";
  } else if (seat.category === "extraLegroom") {
    cls +=
      "border-amber-300/35 bg-amber-500/12 text-amber-50 hover:bg-amber-500/18";
  } else {
    cls +=
      "border-white/[0.14] bg-white/[0.04] text-zinc-100 hover:border-white/[0.22] hover:bg-white/[0.08]";
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onToggle}
      className={cls}
      aria-pressed={selected}
      aria-label={`Seat ${seatId}${isWindow ? ", window" : ""}${
        busy ? ", unavailable" : selected ? ", selected" : ""
      }`}
    >
      {letter}
    </button>
  );
}

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap justify-start gap-x-5 gap-y-2 text-[11px] text-zinc-500">
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-white/[0.14] bg-white/[0.04]" />{" "}
        Economy
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-violet-400/35 bg-violet-500/15 ring-1 ring-violet-400/20" />{" "}
        Business
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-amber-300/35 bg-amber-500/15 ring-1 ring-amber-300/20" />{" "}
        Extra legroom
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-flex h-4 w-6 items-center justify-center rounded border border-white/[0.10] bg-black/30 text-zinc-400">
          <WindowIcon className="h-3 w-3" />
        </span>{" "}
        Window
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-white/[0.10] bg-black/30" />{" "}
        Exit row (14–15)
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block h-4 w-6 rounded border border-zinc-700 bg-zinc-800/80" />{" "}
        Occupied / blocked
      </li>
    </ul>
  );
}
