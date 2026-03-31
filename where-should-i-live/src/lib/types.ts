export type ClimatePreference = "warm" | "cold" | "mixed";
export type LifestylePreference = "city" | "chill" | "nature" | "party";
export type SafetyImportance = 1 | 2 | 3 | 4 | 5;

export type QuizAnswers = {
  monthlyBudgetUsd: number;
  remoteIncome: boolean;
  climate: ClimatePreference;
  lifestyle: LifestylePreference;
  safetyImportance: SafetyImportance;
  regionPreference?: string;
};

export type CityResult = {
  name: string;
  country: string;
  summary: string;
  cost: string;
  whyItMatches: string[];
  imageUrl?: string;
  sources?: Array<{ title: string; url: string }>;
};

export type SeedCity = {
  name: string;
  country: string;
  region: string;
  climate: ClimatePreference;
  tags: LifestylePreference[];
};

