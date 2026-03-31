import type { QuizAnswers, SeedCity } from "@/lib/types";

export function scoreCity(city: SeedCity, answers: QuizAnswers): number {
  let score = 0;

  // Climate match
  if (city.climate === answers.climate) score += 4;
  if (answers.climate === "mixed" && city.climate !== "cold") score += 1;

  // Lifestyle match
  if (city.tags.includes(answers.lifestyle)) score += 5;
  if (answers.lifestyle === "nature" && city.tags.includes("chill")) score += 1;

  // Region preference (optional and fuzzy)
  if (answers.regionPreference) {
    const pref = answers.regionPreference.toLowerCase();
    const region = city.region.toLowerCase();
    if (region.includes(pref) || pref.includes(region)) score += 4;
  }

  // Budget heuristics (very rough tiers based on common perception)
  // These biases are intentionally weak; real cost comes from web grounding later.
  const budget = answers.monthlyBudgetUsd;
  const expensive = new Set([
    "Switzerland",
    "Norway",
    "Denmark",
    "Netherlands",
    "Singapore",
    "Japan",
    "South Korea",
    "Canada",
    "Australia",
    "New Zealand",
    "USA",
  ]);
  if (budget < 2500 && expensive.has(city.country)) score -= 2;
  if (budget > 5000 && expensive.has(city.country)) score += 1;

  // Safety importance: gently down-weight places that are often perceived as riskier
  // (used only for ranking candidates; final text should cite sources).
  if (answers.safetyImportance >= 4) {
    const perceivedRisk = new Set([
      "Colombia",
      "Brazil",
      "South Africa",
      "Mexico",
      "Morocco",
    ]);
    if (perceivedRisk.has(city.country)) score -= 1;
  }

  // Remote income: slight preference for common digital-nomad hubs
  if (answers.remoteIncome) {
    const hubs = new Set([
      "Portugal",
      "Spain",
      "Thailand",
      "Vietnam",
      "Indonesia",
      "Mexico",
    ]);
    if (hubs.has(city.country)) score += 1;
  }

  return score;
}

