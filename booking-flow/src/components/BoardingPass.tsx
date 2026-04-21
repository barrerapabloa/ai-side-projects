import { BrandWordmark } from "@/components/BrandWordmark";

type BoardingPassProps = {
  passengerNo: number;
  givenName: string;
  familyName: string;
  seatId: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departLabel: string;
  arriveLabel: string;
  departDateLabel: string;
  pnr: string;
};

/** Decorative barcode stripe — deterministic from PNR + passenger index. */
function BarcodeStrip({ seed }: { seed: string }) {
  const chars = seed.repeat(4);
  const nums = Array.from({ length: 42 }, (_, i) => {
    const c = chars.charCodeAt(i % chars.length);
    return 2 + (c % 5);
  });
  return (
    <div
      className="flex h-10 w-full items-end justify-between gap-px opacity-90"
      aria-hidden
    >
      {nums.map((w, i) => (
        <span
          key={i}
          className="bg-zinc-800"
          style={{ width: w, height: `${40 + (i % 5) * 6}%` }}
        />
      ))}
    </div>
  );
}

export function BoardingPass({
  passengerNo,
  givenName,
  familyName,
  seatId,
  flightNumber,
  originCode,
  destinationCode,
  departLabel,
  arriveLabel,
  departDateLabel,
  pnr,
}: BoardingPassProps) {
  const displayName = `${givenName} ${familyName}`.trim().toUpperCase();

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-black shadow-[0_24px_60px_-28px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.06]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] bg-white/[0.03] px-5 py-4">
        <div className="text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Boarding pass
          </p>
          <div className="mt-1 text-[15px] leading-none text-white">
            <BrandWordmark />
          </div>
        </div>
        <span className="rounded-md border border-white/[0.1] bg-black/40 px-2 py-1 font-mono text-[11px] text-zinc-400">
          {String(passengerNo).padStart(2, "0")}
        </span>
      </div>

      <div className="px-5 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          Passenger
        </p>
        <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-white">
          {displayName || "GUEST"}
        </p>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-dashed border-white/[0.1] py-5">
          <div>
            <p className="font-mono text-3xl font-bold tabular-nums text-white">
              {originCode}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Depart {departLabel}</p>
          </div>
          <div className="flex flex-1 items-center justify-center px-2">
            <span className="text-2xl text-zinc-600" aria-hidden>
              →
            </span>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-bold tabular-nums text-white">
              {destinationCode}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Arrive {arriveLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-black/35 px-2 py-2 ring-1 ring-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Flight</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-white">
              NMB {flightNumber}
            </p>
          </div>
          <div className="rounded-lg bg-black/35 px-2 py-2 ring-1 ring-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Date</p>
            <p className="mt-0.5 text-[12px] font-medium text-zinc-200">{departDateLabel}</p>
          </div>
          <div className="rounded-lg bg-black/35 px-2 py-2 ring-1 ring-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Seat</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-sky-300">{seatId}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <BarcodeStrip seed={`${pnr}-${passengerNo}`} />
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Record</span>
            <span className="font-mono text-zinc-300">{pnr}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
