"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { PassengerDraft } from "@/types/booking";
import { useBooking } from "@/context/BookingContext";
import { StickyBookingActions } from "@/components/StickyBookingActions";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { buildSeatsForFlight, seatMapFromList, totalSeatFees } from "@/lib/seats";
import { formatUsd } from "@/lib/money";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";

export default function PassengersPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { search, selectedFlight, selectedReturnFlight, selectedSeatIdsOutbound, selectedSeatIdsReturn, passengers, setPassengers } =
    useBooking();

  const seatOk =
    !!search &&
    !!selectedFlight &&
    (search.tripType !== "round-trip" || !!selectedReturnFlight) &&
    selectedSeatIdsOutbound.length === search.passengers &&
    (search.tripType !== "round-trip" || selectedSeatIdsReturn.length === search.passengers);
  useRedirectUnless(Boolean(seatOk), "/search");

  const seatFees = useMemo(() => {
    if (!selectedFlight) return 0;
    const outMap = seatMapFromList(buildSeatsForFlight(selectedFlight.id, selectedFlight.cabinTier));
    const out = totalSeatFees(selectedSeatIdsOutbound, outMap);
    if (search?.tripType === "round-trip" && selectedReturnFlight) {
      const retMap = seatMapFromList(
        buildSeatsForFlight(selectedReturnFlight.id, selectedReturnFlight.cabinTier),
      );
      return out + totalSeatFees(selectedSeatIdsReturn, retMap);
    }
    return out;
  }, [search?.tripType, selectedFlight, selectedReturnFlight, selectedSeatIdsOutbound, selectedSeatIdsReturn]);

  const [rows, setRows] = useState<PassengerDraft[]>(() =>
    passengers.length ? passengers : blankRows(search?.passengers ?? 1),
  );

  if (!search || !selectedFlight) return null;
  const seatsSubtitle =
    search.tripType === "round-trip"
      ? `Out ${selectedSeatIdsOutbound.join(", ")} · Back ${selectedSeatIdsReturn.join(", ")}`
      : `Seats ${selectedSeatIdsOutbound.join(", ")}`;

  function updateRow(i: number, patch: Partial<PassengerDraft>) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function onContinue(e: React.FormEvent) {
    e.preventDefault();
    for (const r of rows) {
      if (
        !r.givenName.trim() ||
        !r.familyName.trim() ||
        !r.email.trim() ||
        !r.dateOfBirth ||
        !r.passportNumber.trim() ||
        !r.passportCountry.trim() ||
        !r.passportExpiry
      ) {
        return;
      }
    }
    setPassengers(rows);
    window.setTimeout(() => router.push("/review"), 0);
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(380px,38vw)] lg:items-start lg:gap-10">
        <div className="space-y-8">
          <StepHeading
            step="Step 4 · Travelers"
            title="Traveler details"
            subtitle={`${seatsSubtitle} · names must match government-issued ID.`}
          />

          <form
            ref={formRef}
            id="travelers-form"
            onSubmit={onContinue}
            className="space-y-10"
          >
            {rows.map((row, i) => (
              <section
                key={i}
                role="group"
                aria-labelledby={`traveler-${i}-heading`}
                className="space-y-4 rounded-2xl border border-white/[0.1] bg-gradient-to-br from-zinc-950/90 to-black/50 p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white ring-1 ring-white/12"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2
                      id={`traveler-${i}-heading`}
                      className="text-[14px] font-semibold leading-tight text-white"
                    >
                      Traveler {i + 1}
                    </h2>
                    <p className="mt-1 text-[12px] leading-snug text-zinc-500">
                      {search.tripType === "round-trip"
                        ? `Out ${selectedSeatIdsOutbound[i] ?? "—"} · Back ${selectedSeatIdsReturn[i] ?? "—"}`
                        : `Seat ${selectedSeatIdsOutbound[i] ?? "—"}`}{" "}
                      · match travel documents
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">Given name</span>
                    <input
                      required
                      value={row.givenName}
                      onChange={(e) =>
                        updateRow(i, { givenName: e.target.value })
                      }
                      className="bf-input"
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">Family name</span>
                    <input
                      required
                      value={row.familyName}
                      onChange={(e) =>
                        updateRow(i, { familyName: e.target.value })
                      }
                      className="bf-input"
                      autoComplete="family-name"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-[12px] text-zinc-500">Email</span>
                    <input
                      required
                      type="email"
                      value={row.email}
                      onChange={(e) => updateRow(i, { email: e.target.value })}
                      className="bf-input"
                      autoComplete="email"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">
                      Date of birth
                    </span>
                    <input
                      required
                      type="date"
                      value={row.dateOfBirth}
                      onChange={(e) =>
                        updateRow(i, { dateOfBirth: e.target.value })
                      }
                      className="bf-input"
                      autoComplete="bday"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">Passport number</span>
                    <input
                      required
                      value={row.passportNumber}
                      onChange={(e) => updateRow(i, { passportNumber: e.target.value })}
                      className="bf-input"
                      autoComplete="off"
                      placeholder="X1234567"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">Issuing country</span>
                    <input
                      required
                      value={row.passportCountry}
                      onChange={(e) => updateRow(i, { passportCountry: e.target.value })}
                      className="bf-input"
                      autoComplete="country"
                      placeholder="Colombia"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[12px] text-zinc-500">Passport expiration</span>
                    <input
                      required
                      type="date"
                      value={row.passportExpiry}
                      onChange={(e) => updateRow(i, { passportExpiry: e.target.value })}
                      className="bf-input"
                      autoComplete="off"
                    />
                  </label>
                </div>
              </section>
            ))}
          </form>
        </div>

        <aside className="mt-10 lg:mt-0 hidden lg:block lg:sticky lg:top-28 space-y-4">
          <TripSummaryCard
            search={search}
            flight={selectedFlight}
            returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
            seatExtrasUsd={seatFees ?? 0}
            seatIds={selectedSeatIdsOutbound}
            seatSummary={
              search.tripType === "round-trip"
                ? `Out: ${selectedSeatIdsOutbound.join(", ")} · Back: ${selectedSeatIdsReturn.join(", ")}`
                : selectedSeatIdsOutbound.join(", ")
            }
          />
        </aside>
      </div>

      <div className="mt-10 lg:hidden">
        <TripSummaryCard
          search={search}
          flight={selectedFlight}
          returnFlight={search.tripType === "round-trip" ? selectedReturnFlight : null}
          seatExtrasUsd={seatFees ?? 0}
          seatIds={selectedSeatIdsOutbound}
          seatSummary={
            search.tripType === "round-trip"
              ? `Out: ${selectedSeatIdsOutbound.join(", ")} · Back: ${selectedSeatIdsReturn.join(", ")}`
              : selectedSeatIdsOutbound.join(", ")
          }
          variant="compact"
        />
      </div>

      <StickyBookingActions
        summaryLabel="Estimated seat extras"
        summaryValue={formatUsd(seatFees ?? 0)}
        hint="Fare + taxes finalized on review"
        secondaryHref="/seats"
        secondaryLabel="Change seats"
        primaryLabel="Review trip"
        onPrimary={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function blankRows(n: number): PassengerDraft[] {
  return Array.from({ length: n }, () => ({
    givenName: "",
    familyName: "",
    email: "",
    dateOfBirth: "",
    passportNumber: "",
    passportCountry: "",
    passportExpiry: "",
  }));
}
