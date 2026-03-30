export type FormatPref = "movie" | "series" | "both";
export type Pace = "slow" | "balanced" | "fast";
export type Tone = "feelgood" | "dark" | "mindbending" | "grounded";
export type Era = "new" | "modern" | "classic" | "any";

export type TitleFormat = "movie" | "series";

export type TitleItem = {
  id: string;
  title: string;
  year?: number;
  format: TitleFormat;
  tags: string[];
  why: string;
  links?: {
    imdb?: string;
    tmdb?: string;
  };
  upcoming?: {
    window: string; // e.g. "May 2026"
  };
  poster?: {
    /** Optional; if omitted we render a premium placeholder poster */
    imageUrl?: string;
    /** Optional; overrides generated gradients */
    accent?: string;
  };
};

export type QuizAnswers = {
  format: FormatPref | null;
  genres: string[]; // max 3
  pace: Pace | null;
  tone: Tone | null;
  era: Era | null;
};

export type UserProfile = {
  format: FormatPref;
  tagWeights: Map<string, number>;
};

const ERA_TAGS: Record<Era, string[]> = {
  new: ["era:new"],
  modern: ["era:modern"],
  classic: ["era:classic"],
  any: [],
};

const PACE_TAGS: Record<Pace, string[]> = {
  slow: ["pace:slow"],
  balanced: ["pace:balanced"],
  fast: ["pace:fast"],
};

const TONE_TAGS: Record<Tone, string[]> = {
  feelgood: ["tone:feelgood"],
  dark: ["tone:dark"],
  mindbending: ["tone:mindbending"],
  grounded: ["tone:grounded"],
};

export function buildProfile(a: QuizAnswers): UserProfile {
  const w = new Map<string, number>();

  const add = (tag: string, weight: number) => {
    w.set(tag, (w.get(tag) ?? 0) + weight);
  };

  // Strongest signals.
  a.genres.forEach((g) => add(`genre:${g}`, 3));
  if (a.pace) PACE_TAGS[a.pace].forEach((t) => add(t, 2));
  if (a.tone) TONE_TAGS[a.tone].forEach((t) => add(t, 2));
  if (a.era) ERA_TAGS[a.era].forEach((t) => add(t, 1.25));

  // Mild signals: formats (used mostly as filter/penalty).
  if (a.format === "movie") add("format:movie", 1);
  if (a.format === "series") add("format:series", 1);

  return { format: a.format ?? "both", tagWeights: w };
}

function jaccardWeighted(profile: UserProfile, item: TitleItem): number {
  const itemTags = new Set(item.tags);
  const itemWeight = 1.0;
  let intersect = 0;
  let union = 0;

  for (const [tag, weight] of profile.tagWeights.entries()) {
    const inItem = itemTags.has(tag);
    if (inItem) intersect += weight;
    union += weight;
  }

  // Add remaining item-only tags as small union mass so ultra-tagged items don't dominate.
  const itemOnly = Array.from(itemTags).filter((t) => !profile.tagWeights.has(t)).length;
  union += itemOnly * itemWeight * 0.2;

  if (union <= 0) return 0;
  return intersect / union;
}

function formatPenalty(formatPref: FormatPref, itemFormat: TitleFormat): number {
  if (formatPref === "both") return 1;
  if (formatPref === itemFormat) return 1;
  return 0.72;
}

function noveltyBoost(item: TitleItem): number {
  // Slightly favor items that are a bit "off-center" (e.g. foreign, indie, miniseries).
  const tags = new Set(item.tags);
  const noveltyTags = [
    "origin:international",
    "origin:indie",
    "format:miniseries",
    "style:arthouse",
  ];
  const hit = noveltyTags.some((t) => tags.has(t));
  return hit ? 1.06 : 1;
}

export function scoreItem(profile: UserProfile, item: TitleItem): number {
  const base = jaccardWeighted(profile, item);
  const fmt = formatPenalty(profile.format, item.format);
  return base * fmt * noveltyBoost(item);
}

export function pickTopDiverse(
  profile: UserProfile,
  items: TitleItem[],
  limit: number,
  seed?: string,
): TitleItem[] {
  const scored = items.map((item) => ({ item, score: scoreItem(profile, item) }));
  const salt = seed ?? "seed";
  scored.sort((a, b) => {
    const d = b.score - a.score;
    if (Math.abs(d) > 1e-6) return d;
    // Stable but "shuffled" tie-break so results don't feel stuck.
    const ha = hash(`${salt}:${a.item.id}`);
    const hb = hash(`${salt}:${b.item.id}`);
    return hb - ha;
  });

  const chosen: TitleItem[] = [];
  const chosenGenres = new Map<string, number>();

  const getPrimaryGenres = (it: TitleItem) =>
    it.tags
      .filter((t) => t.startsWith("genre:"))
      .map((t) => t.slice("genre:".length));

  for (const s of scored) {
    if (chosen.length >= limit) break;
    if (s.score <= 0.03 && chosen.length > 0) break;

    const genres = getPrimaryGenres(s.item);
    const penalty =
      genres.length === 0
        ? 1
        : Math.max(...genres.map((g) => chosenGenres.get(g) ?? 0)) >= 2
          ? 0.7
          : 1;

    const acceptThreshold = chosen.length < Math.min(3, limit) ? 0 : 0.01;
    if (s.score * penalty < acceptThreshold) continue;

    chosen.push(s.item);
    for (const g of genres) chosenGenres.set(g, (chosenGenres.get(g) ?? 0) + 1);
  }

  // Backfill if diversity filtering was too strict.
  if (chosen.length < limit) {
    for (const s of scored) {
      if (chosen.length >= limit) break;
      if (chosen.some((c) => c.id === s.item.id)) continue;
      chosen.push(s.item);
    }
  }

  return chosen.slice(0, limit);
}

export function stableGradientFromId(id: string): { from: string; to: string } {
  // Deterministic "poster" gradient palette.
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue1 = (h >>> 0) % 360;
  const hue2 = (hue1 + 42 + ((h >>> 8) % 90)) % 360;
  return {
    from: `hsl(${hue1} 78% 54%)`,
    to: `hsl(${hue2} 84% 50%)`,
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

