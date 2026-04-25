"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import { airportLabel } from "@/data/airports";
import { BoardingPass } from "@/components/BoardingPass";
import { ScratchReveal, type ScratchRevealHandle } from "@/components/ScratchReveal";
import { formatTripDate } from "@/lib/datetime";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

function IconCheck(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden
      className={props.className}
      fill="currentColor"
    >
      <path
        d="M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z"
      />
    </svg>
  );
}

function IconSeat(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden
      className={props.className}
      fill="currentColor"
    >
      <path
        d="M224,232a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16H216A8,8,0,0,1,224,232Zm-16-88-64.22,0L112,80l14.19-26.32a1.51,1.51,0,0,0,.11-.22A16,16,0,0,0,119.15,32l-.47-.22L85,17.57A16,16,0,0,0,63.8,24.84l-22.12,44a16.1,16.1,0,0,0,0,14.32l58.11,116A15.93,15.93,0,0,0,114.11,208H208a16,16,0,0,0,16-16V160A16,16,0,0,0,208,144Z"
      />
    </svg>
  );
}

function IconCalendar(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden
      className={props.className}
      fill="currentColor"
    >
      <path
        d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM169.66,133.66l-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L116,164.69l42.34-42.35a8,8,0,0,1,11.32,11.32ZM48,80V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80Z"
      />
    </svg>
  );
}

function IconCopy(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <path
        d="M9 9h10v12H9V9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDownload(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <path
        d="M12 3v10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const paramPnr = searchParams.get("pnr");
  const router = useRouter();
  const {
    search,
    selectedFlight,
    selectedReturnFlight,
    paidAt,
    confirmationCode,
    passengers,
    selectedSeatIdsOutbound,
    selectedSeatIdsReturn,
    resetFlow,
  } = useBooking();

  const [copied, setCopied] = useState<"summary" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const passRefs = useRef<Array<HTMLElement | null>>([]);
  const scratchRefs = useRef<Array<ScratchRevealHandle | null>>([]);

  const pnr = paramPnr ?? confirmationCode;
  const ok = Boolean(
    pnr &&
      paidAt &&
      search &&
      selectedFlight &&
      (search.tripType !== "round-trip" || selectedReturnFlight) &&
      passengers.length > 0,
  );
  useRedirectUnless(ok, "/search");

  const shareSummary = useCallback(() => {
    if (!search || !selectedFlight || !pnr) return "";
    const lines = passengers.map((p, i) => {
      const seat = selectedSeatIdsOutbound[i] ?? "—";
      return `• ${p.givenName} ${p.familyName} — seat ${seat}`;
    });
    return [
      `SpaceX Air · ${pnr}`,
      `${airportLabel(search.origin)} → ${airportLabel(search.destination)}`,
      `${formatTripDate(search.departDate)} · NMB ${selectedFlight.flightNumber}`,
      ...lines,
    ].join("\n");
  }, [search, selectedFlight, pnr, passengers, selectedSeatIdsOutbound]);

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(shareSummary());
      setCopied("summary");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleDownloadPng() {
    if (downloading) return;
    setDownloading(true);
    try {
      // Ensure the exported PNG is the revealed boarding pass.
      for (const r of scratchRefs.current) r?.reveal();

      const nodes = passRefs.current.filter(Boolean) as HTMLElement[];
      if (!nodes.length) return;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#07080a",
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `boarding-pass-${pnr}-${String(i + 1).padStart(2, "0")}.png`;
        a.click();
      }
    } finally {
      setDownloading(false);
    }
  }

  if (!search || !selectedFlight || !pnr) return null;

  const departDateLabel = formatTripDate(search.departDate);
  const paidAtLabel = paidAt ? new Date(paidAt).toLocaleString() : null;
  const returnDateLabel =
    search.tripType === "round-trip" && search.returnDate
      ? formatTripDate(search.returnDate)
      : null;

  const legs =
    search.tripType === "round-trip" && selectedReturnFlight && returnDateLabel
      ? ([
          {
            key: "outbound",
            originCode: search.origin,
            destinationCode: search.destination,
            departLabel: selectedFlight.departLabel,
            arriveLabel: selectedFlight.arriveLabel,
            flightNumber: selectedFlight.flightNumber,
            departDateLabel,
            seatIds: selectedSeatIdsOutbound,
          },
          {
            key: "return",
            originCode: search.destination,
            destinationCode: search.origin,
            departLabel: selectedReturnFlight.departLabel,
            arriveLabel: selectedReturnFlight.arriveLabel,
            flightNumber: selectedReturnFlight.flightNumber,
            departDateLabel: returnDateLabel,
            seatIds: selectedSeatIdsReturn,
          },
        ] as const)
      : ([
          {
            key: "outbound",
            originCode: search.origin,
            destinationCode: search.destination,
            departLabel: selectedFlight.departLabel,
            arriveLabel: selectedFlight.arriveLabel,
            flightNumber: selectedFlight.flightNumber,
            departDateLabel,
            seatIds: selectedSeatIdsOutbound,
          },
        ] as const);

  // UX: on confirmation we only surface the next (outbound) boarding pass.
  // The return pass is only relevant close to the return date.
  const legsToRender = legs.slice(0, 1);

  // (Header uses only the confirmation message; no handle/avatar row.)
  const seatPrimary = selectedSeatIdsOutbound[0] ?? "—";
  const departLine = `${formatTripDate(search.departDate)}, ${selectedFlight.departLabel}`;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-6xl items-center justify-center py-14 lg:py-20">
      <div className="mx-auto grid w-full max-w-5xl translate-y-6 items-start justify-center gap-10 lg:grid-cols-[460px_520px] lg:items-center lg:gap-14">
        <div className="space-y-8 text-left">
          <header className="w-full space-y-3">
            <p className="text-[26px] font-medium leading-tight text-white sm:text-[30px]">
              <span className="text-white/60">Your flight has been</span>{" "}
              <span className="inline-flex items-center gap-2 align-baseline font-semibold text-white">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25">
                  <IconCheck className="h-4 w-4" />
                </span>
                confirmed
              </span>
              <span className="text-white/60">, your seat is</span>{" "}
              <span className="inline-flex items-center gap-2 align-baseline font-semibold text-white">
                <span className="grid size-7 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25">
                  <IconSeat className="h-4 w-4" />
                </span>
                <span className="tabular-nums">{seatPrimary}</span>
              </span>
              <span className="text-white/60">, and your departure is</span>{" "}
              <span className="inline-flex items-center gap-2 align-baseline font-semibold text-white">
                <span className="grid size-7 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25">
                  <IconCalendar className="h-4 w-4" />
                </span>
                <span className="tabular-nums">{departLine}</span>
              </span>
              .
            </p>
          </header>

          <div className="flex flex-wrap items-center justify-start gap-3">
        <button
          type="button"
          onClick={() => void handleCopySummary()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.1]"
        >
          <IconCopy className="size-[18px] text-white/60" />
          {copied === "summary" ? "Copied" : "Copy details"}
        </button>
        <button
          type="button"
          onClick={() => void handleDownloadPng()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.1]"
        >
          <IconDownload className="size-[18px] text-white/60" />
          {downloading ? "Preparing…" : "Download boarding pass"}
        </button>
          </div>

          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={() => {
                resetFlow();
                router.push("/search");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.12] bg-transparent px-6 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Book another trip
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Boarding pass
          </p>
          <div className="flex justify-center">
            {legsToRender.flatMap((leg, legIdx) =>
              passengers.map((p, i) => {
                const idx = legIdx * passengers.length + i;
                return (
                  <ScratchReveal
                    key={`${leg.key}-${p.email}-${i}`}
                    ref={(r) => {
                      scratchRefs.current[idx] = r;
                    }}
                    className="w-full max-w-[520px] rounded-2xl"
                  >
                    <BoardingPass
                      ref={(el) => {
                        passRefs.current[idx] = el;
                      }}
                      passengerNo={i + 1}
                      givenName={p.givenName}
                      familyName={p.familyName}
                      seatId={leg.seatIds[i] ?? "—"}
                      flightNumber={leg.flightNumber}
                      originCode={leg.originCode}
                      destinationCode={leg.destinationCode}
                      departLabel={leg.departLabel}
                      arriveLabel={leg.arriveLabel}
                      departDateLabel={leg.departDateLabel}
                      pnr={pnr}
                    />
                  </ScratchReveal>
                );
              }),
            )}
          </div>

          <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Reference <span className="tabular-nums text-white">{pnr}</span>
            <span className="px-2 text-white/15">•</span>
            {paidAtLabel ?? "Recently"}
          </p>
        </div>
      </div>
    </div>
  );
}
