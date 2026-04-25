"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/money";
import { fareTierAddOnUsdPerPax } from "@/lib/fareTier";
import {
  buildSeatsForFlight,
  seatMapFromList,
  totalSeatFees,
} from "@/lib/seats";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";
import { TripSummaryCard } from "@/components/TripSummaryCard";

export default function PaymentPage() {
  const router = useRouter();
  const {
    search,
    selectedFlight,
    selectedReturnFlight,
    selectedSeatIdsOutbound,
    selectedSeatIdsReturn,
    passengers,
    selectedFareTier,
    reviewAccepted,
    completePayment,
  } = useBooking();

  const ok =
    !!search &&
    !!selectedFlight &&
    (search.tripType !== "round-trip" || !!selectedReturnFlight) &&
    passengers.length === search.passengers &&
    reviewAccepted;
  useRedirectUnless(ok, "/review");

  const { seatFees, total } = useMemo(() => {
    if (!search || !selectedFlight || (search.tripType === "round-trip" && !selectedReturnFlight))
      return { seatFees: 0, total: 0 };
    const seats = buildSeatsForFlight(selectedFlight.id, selectedFlight.cabinTier);
    const map = seatMapFromList(seats);
    const outFees = totalSeatFees(selectedSeatIdsOutbound, map);
    const seatFees =
      search.tripType === "round-trip" && selectedReturnFlight
        ? outFees +
          totalSeatFees(
            selectedSeatIdsReturn,
            seatMapFromList(
              buildSeatsForFlight(selectedReturnFlight.id, selectedReturnFlight.cabinTier),
            ),
          )
        : outFees;
    const addOn = fareTierAddOnUsdPerPax(selectedFareTier, selectedFlight.cabinTier);
    const legs = search.tripType === "round-trip" ? 2 : 1;
    const base =
      selectedFlight.priceUsd +
      (search.tripType === "round-trip" ? selectedReturnFlight?.priceUsd ?? 0 : 0);
    const fareSubtotal = (base + addOn * legs) * search.passengers;
    return { seatFees, total: fareSubtotal + seatFees };
  }, [search, selectedFlight, selectedReturnFlight, selectedSeatIdsOutbound, selectedSeatIdsReturn, selectedFareTier]);

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
    <div className="space-y-8 pb-40 lg:pb-8">
      <StepHeading
        step="Step 6 · Pay"
        title="Payment"
        subtitle="Simulated checkout — card details never leave your browser."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-zinc-900/35 via-zinc-950/60 to-zinc-950 ring-1 ring-white/[0.06]">
            <div className="border-b border-white/[0.06] bg-white/[0.03] px-5 py-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200">
                Card details
              </h2>
            </div>

            <form onSubmit={pay} className="space-y-5 px-5 py-5">
              <label className="block space-y-2">
                <span className="text-[13px] text-zinc-400">Name on card</span>
                <input required placeholder="Jordan Rivers" className="bf-input" />
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
                  <input required placeholder="MM / YY" className="bf-input" />
                </label>
                <label className="block space-y-2">
                  <span className="text-[13px] text-zinc-400">CVC</span>
                  <input required placeholder="123" className="bf-input" />
                </label>
              </div>

              <button type="submit" disabled={busy} className="bf-btn-primary-bar w-full py-3">
                {busy ? "Processing…" : `Pay ${formatUsd(total)}`}
              </button>

              <p className="text-center text-[12px] text-zinc-600">
                By continuing, you agree this is a simulated charge.
              </p>
            </form>
          </section>

          <Link
            href="/review"
            className="block text-center text-[13px] text-zinc-300 underline underline-offset-2 transition-colors duration-200 hover:text-white"
          >
            Back to review
          </Link>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start space-y-4">
          <TripSummaryCard
            search={search}
            flight={selectedFlight}
            returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
            seatExtrasUsd={seatFees}
            seatIds={
              search.tripType === "round-trip"
                ? [...selectedSeatIdsOutbound, ...selectedSeatIdsReturn]
                : selectedSeatIdsOutbound
            }
            seatSummary={
              search.tripType === "round-trip"
                ? `Out: ${selectedSeatIdsOutbound.join(", ")} · Back: ${selectedSeatIdsReturn.join(", ")}`
                : selectedSeatIdsOutbound.join(", ")
            }
          />
        </aside>
      </div>

      {/* Mobile: keep a compact summary above the form */}
      <div className="lg:hidden">
        <TripSummaryCard
          search={search}
          flight={selectedFlight}
          returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
          seatExtrasUsd={seatFees}
          seatIds={
            search.tripType === "round-trip"
              ? [...selectedSeatIdsOutbound, ...selectedSeatIdsReturn]
              : selectedSeatIdsOutbound
          }
          seatSummary={
            search.tripType === "round-trip"
              ? `Out: ${selectedSeatIdsOutbound.join(", ")} · Back: ${selectedSeatIdsReturn.join(", ")}`
              : selectedSeatIdsOutbound.join(", ")
          }
          variant="compact"
        />
      </div>
    </div>
  );
}
