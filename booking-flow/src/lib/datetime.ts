/** Parse `YYYY-MM-DD` as local calendar date. */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatTripDate(iso: string): string {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function addDays(iso: string, days: number): Date {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add calendar days to an ISO date string (local). */
export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return formatIsoDate(d);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Earliest selectable return date (day after departure). */
export function minReturnDate(departIso: string): string {
  return addDaysIso(departIso, 1);
}
