export type Airport = { code: string; city: string };

export const AIRPORTS: Airport[] = [
  { code: "BOG", city: "Bogotá" },
  { code: "CDG", city: "Paris" },
  { code: "JFK", city: "New York" },
  { code: "LAX", city: "Los Angeles" },
  { code: "SFO", city: "San Francisco" },
  { code: "MIA", city: "Miami" },
  { code: "DFW", city: "Dallas" },
  { code: "ORD", city: "Chicago" },
  { code: "AMS", city: "Amsterdam" },
  { code: "MEX", city: "Mexico City" },
  { code: "LHR", city: "London" },
];

export function airportLabel(code: string): string {
  const a = AIRPORTS.find((x) => x.code === code);
  return a ? `${a.city} (${a.code})` : code;
}
