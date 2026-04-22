"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useBooking } from "@/context/BookingContext";
import { useRedirectUnless } from "@/hooks/useRedirectUnless";
import { StepHeading } from "@/components/StepHeading";
import { fareTierAddOnUsdPerPax, fareTierOptions, type FareTier } from "@/lib/fareTier";
import { formatUsd } from "@/lib/money";

export default function FarePage() {
  const router = useRouter();
  const { search, selectedFlight, selectedReturnFlight, selectedFareTier, setSelectedFareTier } =
    useBooking();

  const ok = Boolean(
    search &&
      selectedFlight &&
      (search.tripType !== "round-trip" || selectedReturnFlight),
  );
  useRedirectUnless(ok, "/search");

  const options = useMemo(() => {
    return fareTierOptions(selectedFlight?.cabinTier);
  }, [selectedFlight?.cabinTier]);

  if (!search || !selectedFlight) return null;

  const legs = search.tripType === "round-trip" ? 2 : 1;
  const basePerPax =
    selectedFlight.priceUsd + (search.tripType === "round-trip" ? selectedReturnFlight?.priceUsd ?? 0 : 0);
  const addOnPerPax = fareTierAddOnUsdPerPax(selectedFareTier, selectedFlight.cabinTier);

  return (
    <div className="space-y-8">
      <StepHeading
        step="Step 2.5 · Fare"
        title="Choose your fare"
        subtitle="Pick a bundle that matches your flexibility and baggage needs."
      />

      <section>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {options.map((o) => {
            const selected = selectedFareTier === o.tier;
            const perPax = basePerPax + o.addOnUsdPerPax * legs;
            const total = perPax * search.passengers;

            const palette =
              o.tier === "light"
                ? {
                    eyebrow: "text-zinc-400",
                    border: "border-white/[0.14]",
                    pill: "bg-white/[0.08] text-white",
                    ribbon: "bg-white text-black",
                    icon: "text-zinc-200",
                  }
                : o.tier === "classic"
                  ? {
                      eyebrow: "text-violet-300",
                      border: "border-violet-400/35",
                      pill: "bg-violet-500/20 text-white",
                      ribbon: "bg-violet-500 text-white",
                      icon: "text-violet-200",
                    }
                  : {
                      eyebrow: "text-amber-300",
                      border: "border-amber-400/35",
                      pill: "bg-amber-500/20 text-white",
                      ribbon: "bg-amber-400 text-black",
                      icon: "text-amber-200",
                    };

            return (
              <button
                key={o.tier}
                type="button"
                onClick={() => {
                  if (selected) {
                    router.push("/seats");
                    return;
                  }
                  setSelectedFareTier(o.tier as FareTier);
                }}
                aria-pressed={selected}
                    className={`bf-interactive-surface relative flex min-h-[468px] flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-zinc-900/50 via-zinc-950/70 to-black p-6 text-left shadow-[0_18px_55px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.08] ${
                  selected
                        ? `border-white/80 shadow-[0_32px_90px_-54px_rgba(0,0,0,0.95)] ring-2 ring-white/30`
                        : "border-white/[0.18] hover:-translate-y-[1px] hover:border-white/[0.26] hover:bg-white/[0.02]"
                }`}
              >
                {o.tone === "featured" ? (
                  <span
                    className={`absolute right-4 top-4 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${palette.ribbon}`}
                  >
                    Best option
                  </span>
                ) : null}

                {selected ? (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black">
                    ✓ Selected
                  </span>
                ) : null}

                <p
                  className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${palette.eyebrow}`}
                >
                  {o.title}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {o.tier === "light"
                    ? "Light"
                    : o.tier === "classic"
                      ? "Classic"
                      : "Flex"}
                </p>
                <p className="mt-2 text-[13px] text-zinc-400">{o.tagline}</p>

                <ul className="mt-5 space-y-2 text-[13px] text-zinc-200/85">
                  {o.includes.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className={`mt-[2px] ${palette.icon}`} aria-hidden>
                        ✓
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <div className="text-[11px] text-zinc-500">Price per passenger</div>
                  <div className="mt-2 text-[24px] font-semibold tabular-nums text-white">
                    {formatUsd(perPax)}
                  </div>
                  <p className="mt-2 text-[12px] text-zinc-500">
                    Total {formatUsd(total)} · {search.passengers}{" "}
                    {search.passengers === 1 ? "traveler" : "travelers"}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600">
                    Tip: click again to continue
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
        <div className="text-[13px] text-zinc-400">
          Base fare {formatUsd(basePerPax)} + bundle{" "}
          <span className="tabular-nums text-zinc-200">
            {formatUsd(addOnPerPax)}
          </span>{" "}
          / passenger
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/flights")}
            className="bf-btn-secondary-bar"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push("/seats")}
            className="bf-btn-primary-bar"
          >
            Continue to seats
          </button>
        </div>
      </div>
    </div>
  );
}

