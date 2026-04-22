import type { Seat, SeatCategory, SeatState, SeatType } from "@/types/booking";
import type { CabinTier } from "@/types/booking";
import { hashString } from "@/lib/hash";

const ROWS = 30;
const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
const WING_LO = 9;
const WING_HI = 11;

export { ROWS, LETTERS, WING_LO, WING_HI };

function mulberry32(seed: number) {
  let a = seed | 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function letterToType(letter: string): SeatType {
  if (letter === "A" || letter === "F") return "window";
  if (letter === "B" || letter === "E") return "middle";
  return "aisle";
}

/**
 * Deterministic cabin for a flight — same `flightId` always yields the same map.
 */
export function buildSeatsForFlight(
  flightId: string,
  cabinTier: CabinTier | undefined = "economy",
): Seat[] {
  const tier: CabinTier = cabinTier ?? "economy";
  const rand = mulberry32(hashString(`seatmap:${flightId}:${tier}`));
  const list: Seat[] = [];

  for (let row = 1; row <= ROWS; row++) {
    for (const letter of LETTERS) {
      const id = `${row}${letter}`;
      const type = letterToType(letter);
      const r = rand();

      let state: SeatState = "available";
      // Make the cabin feel "real".
      // Target: ~24% occupied (visually "24% full"), plus a smaller slice restricted.
      if (r < 0.24) state = "occupied";
      else if (r < 0.32) state = "restricted";

      let category: SeatCategory = "standard";
      const exitRow = row === 14 || row === 15;
      if (state === "available") {
        if (row >= 1 && row <= 6) category = "premium";
        else if (exitRow && rand() > 0.35) category = "extraLegroom";
        else if ((row === 12 || row === 13) && rand() > 0.4) {
          category = "extraLegroom";
        }
      }

      let price: number | null = null;
      if (state === "available") {
        if (category === "premium") price = 45 + Math.floor(rand() * 55);
        else if (category === "extraLegroom") price = 38 + Math.floor(rand() * 48);
        else price = 18 + Math.floor(rand() * 32);
      }

      // Cabin gating + business layout:
      // - Economy fares can upgrade into the business cabin seats (rows 1–6).
      // - Business fares only sell the premium cabin (rows 1–6); economy rows are blocked.
      // - In business cabin, only letters B and F are blocked (2–2: A/C + D/E).
      if (tier === "economy") {
        // Allow premium seats as an upsell in economy flows.
      } else if (tier === "business") {
        if (row > 6) {
          state = "restricted";
          price = null;
        }
        if (letter === "B" || letter === "F") {
          state = "restricted";
          price = null;
        }
      } else if (tier === "first") {
        // Keep first-class simple: only allow premium cabin seats + block rest.
        if (row > 6) {
          state = "restricted";
          price = null;
        }
        if (letter === "B" || letter === "F") {
          state = "restricted";
          price = null;
        }
      }

      list.push({
        id,
        row,
        letter,
        type,
        category,
        state,
        price,
      });
    }
  }

  return list;
}

export function seatMapFromList(seats: Seat[]): Record<string, Seat> {
  return Object.fromEntries(seats.map((s) => [s.id, s]));
}

export function totalSeatFees(
  seatIds: string[],
  seatById: Record<string, Seat | undefined>,
): number {
  let sum = 0;
  for (const id of seatIds) {
    const p = seatById[id]?.price;
    if (p != null) sum += p;
  }
  return sum;
}
