import { hashString } from "@/lib/hash";

/** Synthetic fare + demand score for calendar heatmap (not real inventory). */
export type SyntheticDayFare = {
  usd: number;
  /** 0 = cooler pricing in this synthetic model, 1 = hotter */
  stress: number;
};

export function getSyntheticDayFare(
  origin: string,
  destination: string,
  iso: string,
): SyntheticDayFare {
  const base = hashString(`${origin}|${destination}|${iso}`);
  const wave = Math.sin((base % 360) * (Math.PI / 180)) * 0.5 + 0.5;
  const usd = 220 + (base % 820) + Math.round(wave * 90);
  const stress = ((base >> 9) % 100) / 100;
  return { usd, stress };
}

export function fareHeatClasses(stress: number): string {
  if (stress < 0.34) {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/25";
  }
  if (stress > 0.66) {
    return "border-rose-500/35 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25";
  }
  return "border-amber-500/30 bg-amber-500/12 text-amber-50 hover:bg-amber-500/22";
}
