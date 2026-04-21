"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { airportLabel } from "@/data/airports";
import { BrandWordmark } from "@/components/BrandWordmark";
import { BoardingPass } from "@/components/BoardingPass";
import { formatTripDate } from "@/lib/datetime";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("link");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          You&apos;re good to go
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Reference{" "}
          <span className="font-mono text-[15px] font-semibold text-sky-400">{pnr}</span>
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
          className="rounded-xl border border-white/[0.14] bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.1]"
        >
          Share itinerary
        </button>
        <button
          type="button"
          onClick={() => void handleCopySummary()}
          className="rounded-xl border border-white/[0.12] bg-transparent px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          {copied === "summary" ? "Copied" : "Copy details"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className="rounded-xl border border-white/[0.12] bg-transparent px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          {copied === "link" ? "Link copied" : "Copy page link"}
        </button>
      </div>

      <div>
        <h2 className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Boarding passes
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {passengers.map((p, i) => (
            <BoardingPass
              key={`${p.email}-${i}`}
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
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 px-5 py-4 text-center text-[13px] text-zinc-500 ring-1 ring-white/[0.04]">
        <BrandWordmark className="text-zinc-400" /> · {search.origin} →{" "}
        {search.destination} · NMB {selectedFlight.flightNumber}
      </div>

      <button
        type="button"
        onClick={() => {
          resetFlow();
          router.push("/search");
        }}
        className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:bg-zinc-100"
      >
        Book another trip
      </button>

      <p className="text-center text-[13px] text-zinc-600">
        <Link href="/search" className="text-zinc-400 underline underline-offset-2 hover:text-white">
          Back to search
        </Link>
      </p>
    </div>
  );
}
