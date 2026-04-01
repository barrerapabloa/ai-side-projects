import type { CityResult } from "@/lib/types";

export const DEMO_CITIES = [
  {
    name: "Lisbon",
    country: "Portugal",
    summary:
      "Sun, walkability, strong remote-worker scene, and a balanced pace.",
    cost: "$$",
    whyItMatches: ["Warm climate", "City + chill lifestyle", "Good remote fit"],
    sources: [
      { title: "Numbeo (cost overview)", url: "https://www.numbeo.com/" },
    ],
  },
  {
    name: "Mexico City",
    country: "Mexico",
    summary:
      "Big-city energy with great food, culture, and diverse neighborhoods.",
    cost: "$$",
    whyItMatches: ["Vibrant city life", "Great value", "Strong community"],
    sources: [
      { title: "Wikipedia (overview)", url: "https://en.wikipedia.org/" },
    ],
  },
  {
    name: "Vancouver",
    country: "Canada",
    summary:
      "Nature access with a polished city core—best for outdoors + comfort.",
    cost: "$$$",
    whyItMatches: ["Nature nearby", "High safety", "Mixed climate"],
    sources: [
      {
        title: "Local guides (highlights)",
        url: "https://www.lonelyplanet.com/",
      },
    ],
  },
] satisfies CityResult[];
