import { z } from "zod";
import seed from "@/../data/cities.seed.json";
import { shortlistCities } from "@/lib/recommend/shortlist";
import type { CityResult, QuizAnswers, SeedCity } from "@/lib/types";
import { wikiSearch, wikiSummary } from "@/lib/search/wikipedia";
import { geocodeCity, weatherSnapshot } from "@/lib/weather/open-meteo";

const answersSchema = z.object({
  monthlyBudgetUsd: z.number().int().min(200).max(100000),
  remoteIncome: z.boolean(),
  climate: z.enum(["warm", "cold", "mixed"]),
  lifestyle: z.enum(["city", "chill", "nature", "party"]),
  safetyImportance: z.number().int().min(1).max(5),
  regionPreference: z.string().min(1).max(40).optional(),
});

const requestSchema = z.object({
  answers: answersSchema,
});

const cityResultSchema = z.object({
  name: z.string().min(2).max(60),
  country: z.string().min(2).max(60),
  summary: z.string().min(20).max(220),
  cost: z.string().min(1).max(20),
  whyItMatches: z.array(z.string().min(3).max(80)).min(2).max(5),
  imageUrl: z.string().url().optional(),
  sources: z
    .array(
      z.object({
        title: z.string().min(2).max(120),
        url: z.string().url(),
      }),
    )
    .max(6)
    .optional(),
});

const responseSchema = z.object({
  cities: z.array(cityResultSchema).length(3),
});

function fallbackFromShortlist(
  shortlist: Array<SeedCity & { score: number }>,
): CityResult[] {
  const top = shortlist.slice(0, 3);
  const costFromCountry = (country: string) => {
    const high = new Set([
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
    const mid = new Set(["Germany", "France", "UK", "Italy", "Spain"]);
    if (high.has(country)) return "$$$";
    if (mid.has(country)) return "$$";
    return "$";
  };

  return top.map((c) => ({
    name: c.name,
    country: c.country,
    summary: "A strong fit based on your preferences, grounded with free sources.",
    cost: costFromCountry(c.country),
    whyItMatches: ["Matches your climate", "Matches your lifestyle", "Fits your region bias"],
    sources: [
      { title: "Wikipedia", url: "https://en.wikipedia.org/" },
      { title: "Open-Meteo", url: "https://open-meteo.com/" },
    ],
  }));
}

function costFromCountry(country: string): "$" | "$$" | "$$$" {
  const high = new Set([
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
  const mid = new Set(["Germany", "France", "UK", "Italy", "Spain"]);
  if (high.has(country)) return "$$$";
  if (mid.has(country)) return "$$";
  return "$";
}

function clampText(s: string, max: number) {
  const cleaned = s.replaceAll(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).trimEnd() + "…";
}

async function buildCityResult(
  city: SeedCity & { score: number },
  answers: QuizAnswers,
): Promise<CityResult> {
  const key = `${city.name}, ${city.country}`;

  const [wikiResults, geo] = await Promise.all([
    wikiSearch(key, 3),
    geocodeCity(city.name, city.country),
  ]);

  const bestWiki = wikiResults[0];
  const wiki = bestWiki ? await wikiSummary(bestWiki.title) : null;
  const weather = geo ? await weatherSnapshot(geo) : null;

  const why: string[] = [];
  why.push(
    answers.lifestyle === "city"
      ? "City energy"
      : answers.lifestyle === "chill"
        ? "Slower pace"
        : answers.lifestyle === "nature"
          ? "Near nature"
          : "Nightlife + social scene",
  );
  why.push(
    answers.climate === "warm"
      ? "Warmer preference"
      : answers.climate === "cold"
        ? "Cooler preference"
        : "Seasonal variety",
  );
  if (answers.remoteIncome) why.push("Remote-friendly bias");
  if (answers.regionPreference) why.push(`Region: ${answers.regionPreference}`);

  const tempLine =
    weather?.temperatureC !== undefined
      ? `Today ~${Math.round(weather.temperatureC)}°C.`
      : "";

  const summaryBase =
    wiki?.extract?.length
      ? clampText(wiki.extract, 140)
      : "A strong fit based on your preferences, grounded with free sources.";

  const summary = clampText(
    [summaryBase, tempLine].filter(Boolean).join(" "),
    200,
  );

  const sources: CityResult["sources"] = [];
  if (wiki?.url) sources.push({ title: "Wikipedia", url: wiki.url });
  if (geo) {
    const om = new URL("https://open-meteo.com/");
    sources.push({ title: "Open-Meteo", url: om.toString() });
  }

  return {
    name: city.name,
    country: city.country,
    summary,
    cost: costFromCountry(city.country),
    whyItMatches: why.slice(0, 4),
    imageUrl: wiki?.thumbnailUrl,
    sources: sources.slice(0, 4),
  };
}

export async function handleRecommendPost(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const answers = parsed.data.answers as QuizAnswers;
  const cities = seed as unknown as SeedCity[];

  const shortlist = shortlistCities(cities, answers, 10);

  const top = shortlist.slice(0, 3);
  const built = await Promise.all(top.map((c) => buildCityResult(c, answers)));
  const output = responseSchema.safeParse({ cities: built }).success
    ? built
    : fallbackFromShortlist(shortlist);

  return Response.json({
    cities: output,
    meta: {
      usedAI: false,
      provider: "wikipedia+open-meteo",
    },
  });
}
