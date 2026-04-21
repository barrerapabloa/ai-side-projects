/** Curated hero destinations — Unsplash only (deterministic scenes; avoid random placeholders). */
export type SuggestedDestination = {
  code: string;
  city: string;
  /** Short line under title */
  subtitle: string;
  imageSrc: string;
  /** Static marketing line */
  tag?: string;
};

export const SUGGESTED_DESTINATIONS: SuggestedDestination[] = [
  {
    code: "CDG",
    city: "Paris",
    subtitle: "Non-stop · from $662",
    tag: "Popular",
    imageSrc:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop",
  },
  {
    code: "JFK",
    city: "New York",
    subtitle: "Cross Atlantic · from $589",
    tag: "Trending",
    imageSrc:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80&auto=format&fit=crop",
  },
  {
    code: "LAX",
    city: "Los Angeles",
    subtitle: "West coast · from $412",
    imageSrc:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=85&auto=format&fit=crop",
  },
  {
    code: "AMS",
    city: "Amsterdam",
    subtitle: "Canal views · from $498",
    tag: "Guest favorite",
    imageSrc:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=85&auto=format&fit=crop",
  },
];
