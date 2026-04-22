import type { CabinTier } from "@/types/booking";

export type FareTier = "light" | "classic" | "flex";

export type FareTierOption = {
  tier: FareTier;
  title: string;
  tagline: string;
  includes: string[];
  /** Add-on per passenger, USD (simulated). */
  addOnUsdPerPax: number;
  /** Visual tone for the card */
  tone: "quiet" | "featured";
};

export function inferFareTierFromLabel(label: string): FareTier {
  const l = label.toLowerCase();
  if (l.includes("flex")) return "flex";
  if (l.includes("classic")) return "classic";
  return "light";
}

export function fareTierOptions(cabin: CabinTier | undefined): FareTierOption[] {
  // Keep it simple + Avianca-like: 3 tiers, Classic featured.
  // Add-ons are simulated and intentionally conservative.
  const c: CabinTier = cabin ?? "economy";

  if (c === "business" || c === "first") {
    return [
      {
        tier: "light",
        title: "Light",
        tagline: "The basics.",
        includes: ["Personal item", "Carry-on", "Standard seat selection"],
        addOnUsdPerPax: 0,
        tone: "quiet",
      },
      {
        tier: "classic",
        title: "Classic",
        tagline: "Most popular.",
        includes: [
          "Personal item + carry-on",
          "Checked bag",
          "Priority boarding",
          "Flexible seat selection",
        ],
        addOnUsdPerPax: c === "business" ? 120 : 180,
        tone: "featured",
      },
      {
        tier: "flex",
        title: "Flex",
        tagline: "Max flexibility.",
        includes: [
          "All Classic benefits",
          "No-change-fee (simulated)",
          "Priority support",
          "Extra baggage allowance",
        ],
        addOnUsdPerPax: c === "business" ? 220 : 320,
        tone: "quiet",
      },
    ];
  }

  // Economy
  return [
    {
      tier: "light",
      title: "Light",
      tagline: "Travel light.",
      includes: ["Personal item", "Carry-on", "Seat selection (standard)"],
      addOnUsdPerPax: 0,
      tone: "quiet",
    },
    {
      tier: "classic",
      title: "Classic",
      tagline: "Best value.",
      includes: [
        "Personal item + carry-on",
        "Checked bag",
        "Standard seat selection",
        "Miles (simulated)",
      ],
      addOnUsdPerPax: 60,
      tone: "featured",
    },
    {
      tier: "flex",
      title: "Flex",
      tagline: "Change-friendly.",
      includes: [
        "All Classic benefits",
        "More miles (simulated)",
        "Change anytime (simulated)",
        "Priority boarding",
      ],
      addOnUsdPerPax: 120,
      tone: "quiet",
    },
  ];
}

export function fareTierAddOnUsdPerPax(
  tier: FareTier | null | undefined,
  cabin: CabinTier | undefined,
): number {
  const t: FareTier = tier ?? "classic";
  const opt = fareTierOptions(cabin).find((o) => o.tier === t);
  return opt?.addOnUsdPerPax ?? 0;
}

