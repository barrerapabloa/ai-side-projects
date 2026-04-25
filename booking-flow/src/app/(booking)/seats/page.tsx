"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
    selectedSeatIdsOutbound,
    selectedSeatIdsReturn,
    search,
    setSelectedFlight,
    setSelectedReturnFlight,
    toggleSeat,
  } = useBooking();

  const ok = Boolean(
    selectedFlight &&
      search &&
      (search.tripType !== "round-trip" || selectedReturnFlight),
  );
  useRedirectUnless(ok, "/search");

  const max = search?.passengers ?? 1;
  const isRoundTrip = search?.tripType === "round-trip";
  const [leg, setLeg] = useState<"outbound" | "return">("outbound");
  const activeLeg = isRoundTrip ? leg : "outbound";
  const activeFlight = activeLeg === "return" ? selectedReturnFlight : selectedFlight;
  const activeSeatIds = activeLeg === "return" ? selectedSeatIdsReturn : selectedSeatIdsOutbound;

  const readyOutbound = selectedSeatIdsOutbound.length === max && max > 0;
  const readyReturn = !isRoundTrip || (selectedSeatIdsReturn.length === max && max > 0);
  const readyAll = readyOutbound && readyReturn;

  const seatFees = useMemo(() => {
    if (!selectedFlight) return 0;
    const outMap = seatMapFromList(buildSeatsForFlight(selectedFlight.id, selectedFlight.cabinTier));
    const outFees = totalSeatFees(selectedSeatIdsOutbound, outMap);
    if (isRoundTrip && selectedReturnFlight) {
      const retMap = seatMapFromList(
        buildSeatsForFlight(selectedReturnFlight.id, selectedReturnFlight.cabinTier),
      );
      const retFees = totalSeatFees(selectedSeatIdsReturn, retMap);
      return outFees + retFees;
    }
    return outFees;
  }, [selectedFlight, selectedReturnFlight, selectedSeatIdsOutbound, selectedSeatIdsReturn, isRoundTrip]);

  if (!selectedFlight || !search || !activeFlight) return null;

  const seatSummary =
    isRoundTrip
      ? `Out: ${selectedSeatIdsOutbound.join(", ") || "—"} · Back: ${selectedSeatIdsReturn.join(", ") || "—"}`
      : selectedSeatIdsOutbound.join(", ");

  return (
    <>
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,760px)_minmax(340px,420px)] lg:items-start lg:justify-between lg:gap-12">
        <div className="w-full space-y-6">
          <StepHeading
            step="Step 3 · Seats"
            title="Pick seats"
            subtitle={
              isRoundTrip
                ? `Now choosing ${activeLeg === "outbound" ? "outbound" : "return"} seats · ${activeSeatIds.length}/${max} selected · add-ons ${formatUsd(seatFees)}`
                : `Tap a seat to select · tap again to remove · add-ons ${formatUsd(seatFees)}`
            }
          />

          {isRoundTrip ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLeg("outbound")}
                className={activeLeg === "outbound" ? "bf-filter-pill-active" : "bf-filter-pill-idle"}
              >
                Outbound
              </button>
              <button
                type="button"
                onClick={() => setLeg("return")}
                className={activeLeg === "return" ? "bf-filter-pill-active" : "bf-filter-pill-idle"}
              >
                Return
              </button>
            </div>
          ) : null}

          <SeatMap
            flight={activeFlight}
            selectedSeatIds={activeSeatIds}
            onToggleSeat={(id) => toggleSeat(id, activeLeg)}
          />
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
            seatIds={activeSeatIds}
            seatSummary={seatSummary}
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
          seatIds={activeSeatIds}
          seatSummary={seatSummary}
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
        hint={
          isRoundTrip
            ? `Out ${selectedSeatIdsOutbound.length}/${max} · Back ${selectedSeatIdsReturn.length}/${max}`
            : `${selectedSeatIdsOutbound.length}/${max} seats`
        }
        secondaryHref="/flights"
        secondaryLabel="Change flight"
        primaryLabel={isRoundTrip && activeLeg === "outbound" ? "Pick return seats" : "Continue to travelers"}
        primaryDisabled={isRoundTrip && activeLeg === "outbound" ? !readyOutbound : !readyAll}
        onPrimary={() => {
          if (isRoundTrip && activeLeg === "outbound") {
            setLeg("return");
            return;
          }
          router.push("/passengers");
        }}
      />
    </>
  );
}
