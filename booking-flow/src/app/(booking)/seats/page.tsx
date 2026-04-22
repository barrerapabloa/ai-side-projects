"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useBooking } from "@/context/BookingContext";
import { SeatLegend, SeatMap } from "@/components/SeatMap";
import { StickyBookingActions } from "@/components/StickyBookingActions";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { buildSeatsForFlight, seatMapFromList, totalSeatFees } from "@/lib/seats";
import { formatUsd } from "@/lib/money";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";

export default function SeatsPage() {
  const router = useRouter();
  const {
    selectedFlight,
    selectedReturnFlight,
    selectedSeatIds,
    search,
    setSelectedFlight,
    setSelectedReturnFlight,
  } = useBooking();

  const ok = Boolean(
    selectedFlight &&
      search &&
      (search.tripType !== "round-trip" || selectedReturnFlight),
  );
  useRedirectUnless(ok, "/search");

  const max = search?.passengers ?? 1;
  const ready = selectedSeatIds.length === max && max > 0;

  const seatFees = useMemo(() => {
    if (!selectedFlight) return 0;
    const seats = buildSeatsForFlight(selectedFlight.id, selectedFlight.cabinTier);
    const map = seatMapFromList(seats);
    return totalSeatFees(selectedSeatIds, map);
  }, [selectedFlight, selectedSeatIds]);

  if (!selectedFlight || !search) return null;

  return (
    <>
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,760px)_minmax(340px,420px)] lg:items-start lg:justify-between lg:gap-12">
        <div className="w-full space-y-6">
          <StepHeading
            step="Step 3 · Seats"
            title="Pick seats"
            subtitle={`Tap a seat to select · tap again to remove · add-ons ${formatUsd(seatFees)}`}
          />

          <SeatMap />
        </div>

        <aside className="mt-10 lg:mt-0 hidden lg:block lg:sticky lg:top-28">
          <div className="mb-4">
            <SeatLegend />
          </div>
          <TripSummaryCard
            search={search}
            flight={selectedFlight}
            returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
            seatExtrasUsd={seatFees}
            seatIds={selectedSeatIds}
            seatSummary={selectedSeatIds.length ? selectedSeatIds.join(", ") : undefined}
          />
          <button
            type="button"
            onClick={() => {
              setSelectedFlight(null);
              setSelectedReturnFlight(null);
              router.push("/flights?cabin=all");
            }}
            className="mt-4 w-full rounded-xl border border-white/[0.12] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
          >
            See other cabins
          </button>
        </aside>
      </div>

      <div className="mt-8 lg:hidden">
        <div className="mb-4">
          <SeatLegend />
        </div>
        <TripSummaryCard
          search={search}
          flight={selectedFlight}
          returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
          seatExtrasUsd={seatFees}
          seatIds={selectedSeatIds}
          seatSummary={selectedSeatIds.length ? selectedSeatIds.join(", ") : undefined}
          variant="compact"
        />
        <button
          type="button"
          onClick={() => {
            setSelectedFlight(null);
            setSelectedReturnFlight(null);
            router.push("/flights?cabin=all");
          }}
          className="mt-4 w-full rounded-xl border border-white/[0.12] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
        >
          See other cabins
        </button>
      </div>

      <StickyBookingActions
        summaryLabel="Seat add-ons"
        summaryValue={formatUsd(seatFees)}
        hint={`${selectedSeatIds.length}/${max} seats · total with fares on next step`}
        secondaryHref="/flights"
        secondaryLabel="Change flight"
        primaryLabel="Continue to travelers"
        primaryDisabled={!ready}
        onPrimary={() => router.push("/passengers")}
      />
    </>
  );
}
