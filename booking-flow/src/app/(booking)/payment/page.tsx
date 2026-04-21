"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/money";
import {
  buildSeatsForFlight,
  seatMapFromList,
  totalSeatFees,
} from "@/lib/seats";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

export default function PaymentPage() {
  const router = useRouter();
  const {
    search,
    selectedFlight,
    selectedSeatIds,
    passengers,
    reviewAccepted,
    completePayment,
  } = useBooking();

  const ok =
    !!search &&
    !!selectedFlight &&
    passengers.length === search.passengers &&
    reviewAccepted;
  useRedirectUnless(ok, "/review");

  const total = useMemo(() => {
    if (!search || !selectedFlight) return 0;
    const seats = buildSeatsForFlight(selectedFlight.id);
    const map = seatMapFromList(seats);
    return (
      selectedFlight.priceUsd * search.passengers +
      totalSeatFees(selectedSeatIds, map)
    );
  }, [search, selectedFlight, selectedSeatIds]);

  const [busy, setBusy] = useState(false);

  function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const code = completePayment();
    window.setTimeout(() => {
      router.push(`/confirmation?pnr=${encodeURIComponent(code)}`);
    }, 450);
  }

  if (!search || !selectedFlight) return null;

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Payment
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Details stay in your browser — nothing is sent to a payment processor.
        </p>
      </div>

      <form onSubmit={pay} className="space-y-5">
        <label className="block space-y-2">
          <span className="text-[13px] text-zinc-400">Name on card</span>
          <input
            required
            placeholder="Jordan Rivers"
            className="bf-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[13px] text-zinc-400">Card number</span>
          <input
            required
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            className="bf-input"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-[13px] text-zinc-400">Expiry</span>
            <input
              required
              placeholder="MM / YY"
              className="bf-input"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[13px] text-zinc-400">CVC</span>
            <input
              required
              placeholder="123"
              className="bf-input"
            />
          </label>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm">
          <span className="text-zinc-400">Amount due </span>
          <span className="font-semibold text-white">{formatUsd(total)}</span>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="bf-btn-primary-emerald"
        >
          {busy ? "Processing…" : `Pay ${formatUsd(total)}`}
        </button>
      </form>

      <Link
        href="/review"
        className="block text-center text-[13px] text-zinc-500 underline underline-offset-2"
      >
        Back to review
      </Link>
    </div>
  );
}
