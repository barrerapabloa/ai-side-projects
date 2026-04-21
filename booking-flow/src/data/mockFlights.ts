import { hashString } from "@/lib/hash";
import {
  addDays,
  formatShortDate,
  parseIsoDate,
} from "@/lib/datetime";
import type { CabinTier, Flight } from "@/types/booking";

function mulberry32(seed: number) {
  return function rand() {
    let a = seed | 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const timeStr = (h: number, m: number) => {
  const p = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${m.toString().padStart(2, "0")} ${p}`;
};

const AIRCRAFT = [
  "Airbus A350-900",
  "Boeing 787-9",
  "Airbus A330-900neo",
  "Boeing 777-300ER",
] as const;

const FARES = [
  "Economy Classic",
  "Economy Flex",
  "Economy Plus",
  "Economy Smart",
] as const;

const BAGGAGE_ECONOMY = [
  "Carry-on + 1 checked bag included",
  "Carry-on included · first checked bag +$65",
  "Carry-on + 2 checked bags included",
  "Carry-on included · checked bags from $55",
] as const;

const BAGGAGE_BUSINESS =
  "Carry-on + 2 checked bags · priority boarding · lounge where available";

const BAGGAGE_FIRST =
  "Carry-on + 3 checked bags · lie-flat suite · arrivals lounge";

const TIERS: { tier: CabinTier; priceMul: number }[] = [
  { tier: "economy", priceMul: 1 },
  { tier: "business", priceMul: 2.85 },
  { tier: "first", priceMul: 5.35 },
];

/**
 * Mock results for a route + day. Times and prices are stable for the same inputs.
 * Each itinerary is expanded to economy, business, and first.
 */
export function getMockFlights(
  origin: string,
  destination: string,
  departDate: string,
): Flight[] {
  const routeSeed =
    (hashString(`${origin}-${destination}-${departDate}`) +
      hashString(`${destination}-${origin}`)) >>>
    0;

  const slotCount = 4 + (routeSeed % 3); // base slots → ×3 tiers
  const flights: Flight[] = [];

  for (let i = 0; i < slotCount; i++) {
    const rand = mulberry32((routeSeed + (i + 1) * 2654435761) >>> 0);

    const departH = 6 + Math.floor(rand() * 14);
    const departM = rand() > 0.5 ? 0 : 30;
    let durationMin = 380 + Math.floor(rand() * 340);
    const stopsN = rand() > 0.82 ? 1 : 0;
    if (stopsN === 1) durationMin += 90 + Math.floor(rand() * 160);

    const departMinutes = departH * 60 + departM;
    const arriveTotalMin = departMinutes + durationMin;
    const calendarShift = Math.floor(arriveTotalMin / (60 * 24));
    const clockMin = arriveTotalMin % (60 * 24);
    const ah = Math.floor(clockMin / 60) % 24;
    const am = clockMin % 60;

    const departDayCal = parseIsoDate(departDate);
    const arriveDayCal = addDays(departDate, calendarShift);
    const arriveDaySummary =
      calendarShift === 0
        ? `Same day · ${formatShortDate(departDayCal)}`
        : `Arrives ${formatShortDate(arriveDayCal)} (+${calendarShift} day${calendarShift === 1 ? "" : "s"})`;

    const basePrice = 420 + Math.floor(rand() * 610);
    const jitter = Math.floor(rand() * 140) - 70;

    const stopsLabel =
      stopsN === 0
        ? "Nonstop"
        : `1 stop · ${Math.floor(45 + rand() * 120)}m layover`;

    const aircraftType = AIRCRAFT[Math.floor(rand() * AIRCRAFT.length)]!;
    const flightNumber = `${200 + Math.floor(rand() * 799)}`;
    const economyFareLabel = FARES[Math.floor(rand() * FARES.length)]!;
    const economyBagRand = mulberry32((routeSeed + i * 7919 + 3) >>> 0);
    const economyBaggage =
      BAGGAGE_ECONOMY[Math.floor(economyBagRand() * BAGGAGE_ECONOMY.length)]!;

    for (const tierDef of TIERS) {
      const priceUsd = Math.round(
        Math.max(
          tierDef.tier === "economy"
            ? 299
            : tierDef.tier === "business"
              ? 899
              : 2499,
          (basePrice + jitter) * tierDef.priceMul,
        ),
      );

      const baggageIncluded =
        tierDef.tier === "first"
          ? BAGGAGE_FIRST
          : tierDef.tier === "business"
            ? BAGGAGE_BUSINESS
            : economyBaggage;

      const fareLabel =
        tierDef.tier === "economy"
          ? economyFareLabel
          : tierDef.tier === "business"
            ? "Business"
            : "First Class";

      const id = `NM-${origin}-${destination}-${departDate}-${i}-${tierDef.tier}`;

      flights.push({
        id,
        flightNumber,
        origin,
        destination,
        departLabel: timeStr(departH, departM),
        arriveLabel: timeStr(ah, am),
        durationLabel: `${Math.floor(durationMin / 60)}h ${String(durationMin % 60).padStart(2, "0")}m`,
        priceUsd,
        stopsLabel,
        cabinTier: tierDef.tier,
        fareLabel,
        aircraftType,
        baggageIncluded,
        arriveDaySummary,
      });
    }
  }

  flights.sort((a, b) => a.priceUsd - b.priceUsd);
  return flights;
}
