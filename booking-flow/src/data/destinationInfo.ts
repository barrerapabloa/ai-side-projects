export type DestinationInsight = {
  headline: string;
  climate: string;
  tip: string;
};

const FALLBACK: DestinationInsight = {
  headline: "Before you pack",
  climate: "Seasonal weather varies — check closer to departure.",
  tip: "Save airport maps offline and keep meds in your carry-on.",
};

const BY_CODE: Partial<Record<string, DestinationInsight>> = {
  CDG: {
    headline: "Paris (CDG)",
    climate: "Mild springs & falls; summer tourist peaks.",
    tip: "CDG has multiple terminals — allow extra time for connections.",
  },
  BOG: {
    headline: "Bogotá (BOG)",
    climate: "High-altitude spring-like climate year-round.",
    tip: "Traffic peaks weekday mornings — pad ground transfers.",
  },
  JFK: {
    headline: "New York (JFK)",
    climate: "Cold winters, humid summers — layers help.",
    tip: "AirTrain connects terminals — budget time for security.",
  },
  LAX: {
    headline: "Los Angeles (LAX)",
    climate: "Dry, mild winters; warm dry summers.",
    tip: "Rideshare pickup zones move — follow airport signage.",
  },
  LHR: {
    headline: "London (LHR)",
    climate: "Cool & damp much of the year — pack a shell.",
    tip: "Peak hours at security can spike — arrive early.",
  },
  AMS: {
    headline: "Amsterdam (AMS)",
    climate: "Oceanic — breezy; rain year-round.",
    tip: "Compact terminals — still walk plenty between gates.",
  },
  MEX: {
    headline: "Mexico City (MEX)",
    climate: "Mild days; rainy season roughly May–Oct.",
    tip: "Altitude can hit harder on day one — hydrate.",
  },
};

export function getDestinationInsight(code: string): DestinationInsight {
  return BY_CODE[code] ?? FALLBACK;
}
