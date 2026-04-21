"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useBooking } from "@/context/BookingContext";
import { SeatMap } from "@/components/SeatMap";
import { StickyBookingActions } from "@/components/StickyBookingActions";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { buildSeatsForFlight, seatMapFromList, totalSeatFees } from "@/lib/seats";
import { formatUsd } from "@/lib/money";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";

export default function SeatsPage() {
  const router = useRouter();
  const { selectedFlight, selectedSeatIds, search } = useBooking();

  const ok = Boolean(selectedFlight && search);
  useRedirectUnless(ok, "/search");

  const max = search?.passengers ?? 1;
  const ready = selectedSeatIds.length === max && max > 0;

  const seatFees = useMemo(() => {
    if (!selectedFlight) return 0;
    const seats = buildSeatsForFlight(selectedFlight.id);
    const map = seatMapFromList(seats);
    return totalSeatFees(selectedSeatIds, map);
  }, [selectedFlight, selectedSeatIds]);

  if (!selectedFlight || !search) return null;

  return (
    <>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,720px)_minmax(340px,420px)] lg:items-start lg:justify-between lg:gap-12">
        <div className="w-full space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Pick your seats
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {selectedSeatIds.length} of {max} selected · pinch or scroll the cabin
            </p>
          </div>

          <SeatMap />
        </div>

        <aside className="mt-10 lg:mt-0 hidden lg:block lg:sticky lg:top-28">
          <TripSummaryCard
            search={search}
            flight={selectedFlight}
            seatExtrasUsd={seatFees}
            seatSummary={selectedSeatIds.length ? selectedSeatIds.join(", ") : undefined}
          />
        </aside>
      </div>

      <div className="mt-8 lg:hidden">
        <TripSummaryCard
          search={search}
          flight={selectedFlight}
          seatExtrasUsd={seatFees}
          seatSummary={selectedSeatIds.length ? selectedSeatIds.join(", ") : undefined}
          variant="compact"
        />
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
