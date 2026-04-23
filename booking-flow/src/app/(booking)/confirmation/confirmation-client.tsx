"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import { airportLabel } from "@/data/airports";
import { BoardingPass } from "@/components/BoardingPass";
import { ScratchReveal, type ScratchRevealHandle } from "@/components/ScratchReveal";
import { formatTripDate } from "@/lib/datetime";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

function IconShare(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <path
        d="M12 16V4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
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
    paidAt,
    confirmationCode,
    passengers,
    selectedSeatIds,
    resetFlow,
  } = useBooking();

  const [copied, setCopied] = useState<"summary" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const passRefs = useRef<Array<HTMLElement | null>>([]);
  const scratchRefs = useRef<Array<ScratchRevealHandle | null>>([]);

  const pnr = paramPnr ?? confirmationCode;
  const ok = Boolean(
    pnr && paidAt && search && selectedFlight && passengers.length > 0,
  );
  useRedirectUnless(ok, "/search");

  const shareSummary = useCallback(() => {
    if (!search || !selectedFlight || !pnr) return "";
    const lines = passengers.map((p, i) => {
      const seat = selectedSeatIds[i] ?? "—";
      return `• ${p.givenName} ${p.familyName} — seat ${seat}`;
    });
    return [
      `SpaceX Air · ${pnr}`,
      `${airportLabel(search.origin)} → ${airportLabel(search.destination)}`,
      `${formatTripDate(search.departDate)} · NMB ${selectedFlight.flightNumber}`,
      ...lines,
    ].join("\n");
  }, [search, selectedFlight, pnr, passengers, selectedSeatIds]);

  async function handleShare() {
    const text = shareSummary();
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SpaceX Air booking",
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied("summary");
        window.setTimeout(() => setCopied(null), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied("summary");
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

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

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Booking confirmed
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl lg:text-4xl lg:tracking-tighter">
          You&apos;re good to go
        </h1>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          Reference{" "}
          <span className="tabular-nums text-[15px] font-semibold text-white">{pnr}</span>
        </p>
        {paidAt ? (
          <p className="mt-2 text-[12px] text-zinc-600">
            {new Date(paidAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.1]"
        >
          <IconShare className="size-[18px] text-white/80" />
          Share itinerary
        </button>
        <button
          type="button"
          onClick={() => void handleCopySummary()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-transparent px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <IconCopy className="size-[18px] text-white/60" />
          {copied === "summary" ? "Copied" : "Copy details"}
        </button>
        <button
          type="button"
          onClick={() => void handleDownloadPng()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-transparent px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <IconDownload className="size-[18px] text-white/60" />
          {downloading ? "Preparing…" : "Download boarding pass"}
        </button>
      </div>

      <div>
        <h2 className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Boarding passes
        </h2>
        <div
          className={
            passengers.length === 1
              ? "flex justify-center"
              : "grid gap-6 sm:grid-cols-2"
          }
        >
          {passengers.map((p, i) => (
            <ScratchReveal
              key={`${p.email}-${i}`}
              ref={(r) => {
                scratchRefs.current[i] = r;
              }}
              className="rounded-2xl"
            >
              <BoardingPass
                ref={(el) => {
                  passRefs.current[i] = el;
                }}
                passengerNo={i + 1}
                givenName={p.givenName}
                familyName={p.familyName}
                seatId={selectedSeatIds[i] ?? "—"}
                flightNumber={selectedFlight.flightNumber}
                originCode={search.origin}
                destinationCode={search.destination}
                departLabel={selectedFlight.departLabel}
                arriveLabel={selectedFlight.arriveLabel}
                departDateLabel={departDateLabel}
                pnr={pnr}
              />
            </ScratchReveal>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            resetFlow();
            router.push("/search");
          }}
          className="rounded-xl bg-white px-10 py-3.5 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:bg-zinc-100"
        >
          Book another trip
        </button>
      </div>

      <p className="text-center text-[13px] text-zinc-600">
        <Link href="/search" className="text-zinc-400 underline underline-offset-2 hover:text-white">
          Back to search
        </Link>
      </p>
    </div>
  );
}
