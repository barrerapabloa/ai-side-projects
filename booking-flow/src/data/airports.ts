type AirportRow = {
  iata?: string;
  city?: string;
  name?: string;
  country?: string;
};

export type Airport = {
  code: string;
  city: string;
  name?: string;
  country?: string;
};

// Large airport dataset (IATA) sourced from OpenFlights via `airport-codes`.
import RAW from "airport-codes/airports.json";

export const AIRPORTS: Airport[] = (RAW as AirportRow[])
  .map((r) => ({
    code: (r.iata ?? "").trim().toUpperCase(),
    city: (r.city ?? "").trim(),
    name: (r.name ?? "").trim() || undefined,
    country: (r.country ?? "").trim() || undefined,
  }))
  .filter((a) => a.code && a.city);

export function airportLabel(code: string): string {
  const c = code.trim().toUpperCase();
  const a = AIRPORTS.find((x) => x.code === c);
  return a ? `${a.city} (${a.code})` : c;
}

export function searchAirports(query: string, limit = 10): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, limit);
  const out: Airport[] = [];
  for (const a of AIRPORTS) {
    if (out.length >= limit) break;
    const hay = `${a.code} ${a.city} ${a.name ?? ""} ${a.country ?? ""}`.toLowerCase();
    if (hay.includes(q)) out.push(a);
  }
  return out;
}
