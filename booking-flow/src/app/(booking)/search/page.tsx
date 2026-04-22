"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TripType } from "@/types/booking";
import { useBooking } from "@/context/BookingContext";
import { FlightSearchBar } from "@/components/FlightSearchBar";
import { SuggestedDestinations } from "@/components/SuggestedDestinations";
import { addDaysIso, formatIsoDate, minReturnDate } from "@/lib/datetime";
import { SUGGESTED_DESTINATIONS } from "@/data/suggestedDestinations";
import { StepHeading } from "@/components/StepHeading";

export default function SearchPage() {
  const router = useRouter();
  const { search, setSearch, resetFlow } = useBooking();

  const [tripType, setTripType] = useState<TripType>(
    search?.tripType ?? "one-way",
  );
  const [origin, setOrigin] = useState(search?.origin ?? "BOG");
  const [destination, setDestination] = useState(search?.destination ?? "CDG");
  const [passengers, setPassengers] = useState(search?.passengers ?? 1);

  const defaultDepart = useMemo(() => defaultDepartIso(), []);
  const [departDate, setDepartDate] = useState(
    search?.departDate ?? defaultDepart,
  );
  const [returnDate, setReturnDate] = useState<string | null>(
    search?.tripType === "round-trip"
      ? (search?.returnDate ?? addDaysIso(search?.departDate ?? defaultDepart, 7))
      : null,
  );

  const minToday = useMemo(() => formatIsoDate(new Date()), []);

  function syncTripType(next: TripType) {
    setTripType(next);
    if (next === "one-way") {
      setReturnDate(null);
      return;
    }
    setReturnDate((r) => {
      const floor = minReturnDate(departDate);
      if (!r || r <= departDate) return floor;
      return r < floor ? floor : r;
    });
  }

  function syncDepart(nextDepart: string) {
    setDepartDate(nextDepart);
    if (tripType === "round-trip") {
      const floor = minReturnDate(nextDepart);
      setReturnDate((r) => (!r || r <= nextDepart ? floor : r < floor ? floor : r));
    }
  }

  function syncReturn(nextReturn: string | null) {
    setReturnDate(nextReturn);
  }

  function resetDatesOnly() {
    // Wipe the user's chosen dates (no auto-picking a new range).
    setDepartDate(minToday);
    setReturnDate(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (origin === destination) return;
    if (tripType === "round-trip") {
      const ret =
        !returnDate || returnDate <= departDate ? minReturnDate(departDate) : returnDate;
      setSearch({
        origin,
        destination,
        passengers,
        departDate,
        tripType: "round-trip",
        returnDate: ret,
      });
    } else {
      setSearch({
        origin,
        destination,
        passengers,
        departDate,
        tripType: "one-way",
        returnDate: null,
      });
    }
    window.setTimeout(() => router.push("/flights"), 0);
  }

  const invalid = origin === destination;

  return (
    <div className="space-y-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <StepHeading
          step="Step 1 · Search"
          title="Find a flight"
          subtitle="Set your route and travel dates. You can change this before you pay."
        />

        <form id="flight-search-form" onSubmit={onSubmit}>
          <FlightSearchBar
            tripType={tripType}
            onTripTypeChange={syncTripType}
            origin={origin}
            destination={destination}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            departDate={departDate}
            returnDate={returnDate}
            onDepartChange={syncDepart}
            onReturnChange={syncReturn}
            passengers={passengers}
            onPassengersChange={setPassengers}
            minDate={minToday}
            onResetDates={resetDatesOnly}
            invalidRoute={invalid}
          />
        </form>
      </div>

      <div className="mx-auto max-w-5xl">
        <SuggestedDestinations
          items={SUGGESTED_DESTINATIONS}
          onPick={(code) => {
            setDestination(code);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] pt-8 text-center">
        <button
          type="button"
          onClick={() => {
            resetFlow();
            setTripType("one-way");
            setOrigin("BOG");
            setDestination("CDG");
            setPassengers(1);
            const dep = defaultDepartIso();
            setDepartDate(dep);
            setReturnDate(null);
          }}
          className="text-[13px] font-medium text-zinc-500 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
        >
          Reset search
        </button>
      </div>
    </div>
  );
}

function defaultDepartIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return formatIsoDate(d);
}
