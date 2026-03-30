import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, "data", "underrated.json");

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.error("Missing TMDB_API_KEY. Create a .env.local with TMDB_API_KEY=...");
  process.exit(1);
}

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdb(pathname, params = {}) {
  const url = new URL(`${TMDB}${pathname}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status} ${res.statusText} for ${url} ${t}`);
  }
  return res.json();
}

async function externalIds(kind, id) {
  const route = kind === "movie" ? `/movie/${id}/external_ids` : `/tv/${id}/external_ids`;
  return tmdb(route, {});
}

function eraTag(year) {
  if (!year) return null;
  if (year >= 2018) return "era:new";
  if (year >= 2000) return "era:modern";
  return "era:classic";
}

function toneAndPaceFromGenres(genreNames) {
  const g = new Set(genreNames.map((x) => x.toLowerCase()));

  let tone = "tone:grounded";
  if (g.has("horror") || g.has("crime") || g.has("war")) tone = "tone:dark";
  else if (g.has("comedy") || g.has("family") || g.has("music"))
    tone = "tone:feelgood";
  else if (g.has("science fiction") || g.has("mystery"))
    tone = "tone:mindbending";
  else if (g.has("thriller")) tone = "tone:dark";

  let pace = "pace:balanced";
  if (g.has("thriller") || g.has("action") || g.has("horror")) pace = "pace:fast";
  else if (g.has("drama") || g.has("romance") || g.has("history")) pace = "pace:slow";

  return { tone, pace };
}

function normalizeGenre(name) {
  const n = name.toLowerCase();
  if (n === "science fiction") return "sci-fi";
  if (n === "tv movie") return null;
  if (n === "western") return null;
  return n;
}

function clipWhy(overview) {
  const t = (overview || "").replace(/\s+/g, " ").trim();
  if (!t) return "A pick matched to your taste—worth a look.";
  const max = 140;
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function fetchGenreMap(kind) {
  const json = await tmdb(`/genre/${kind}/list`);
  const m = new Map();
  for (const g of json.genres || []) m.set(g.id, g.name);
  return m;
}

async function buildItem(kind, raw, genreMap) {
  const title = kind === "movie" ? raw.title : raw.name;
  const date = kind === "movie" ? raw.release_date : raw.first_air_date;
  const year = date ? Number(date.slice(0, 4)) : undefined;

  const genreNames = (raw.genre_ids || [])
    .map((id) => genreMap.get(id))
    .filter(Boolean);

  const genres = genreNames
    .map((n) => normalizeGenre(n))
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `genre:${g}`);

  const { tone, pace } = toneAndPaceFromGenres(genreNames);
  const era = eraTag(year);

  const tags = uniqBy(
    [
      ...genres,
      tone,
      pace,
      era,
      kind === "movie" ? "format:movie" : "format:series",
      raw.original_language && raw.original_language !== "en"
        ? "origin:international"
        : null,
    ].filter(Boolean),
    (x) => x,
  );

  let imdb = null;
  try {
    const ids = await externalIds(kind, raw.id);
    imdb = ids?.imdb_id || null;
  } catch {
    // ignore per-item failures
  }

  return {
    id: `tmdb-${kind}-${raw.id}`,
    title,
    year,
    format: kind,
    tags,
    why: clipWhy(raw.overview),
    links: {
      tmdb: `https://www.themoviedb.org/${kind === "movie" ? "movie" : "tv"}/${raw.id}`,
      imdb: imdb ? `https://www.imdb.com/title/${imdb}/` : undefined,
    },
    poster: raw.poster_path ? { imageUrl: `${IMG}${raw.poster_path}` } : undefined,
  };
}

async function discover(kind, page, extra = {}) {
  const base = {
    sort_by: "vote_average.desc",
    "vote_count.gte": 150,
    include_adult: "false",
    ...extra,
    page,
  };
  return tmdb(`/discover/${kind}`, base);
}

async function run() {
  const movieGenres = await fetchGenreMap("movie");
  const tvGenres = await fetchGenreMap("tv");

  const all = [];

  // A few "lanes" to keep the dataset diverse.
  const lanes = [
    { label: "modern", params: { "primary_release_date.gte": "2000-01-01" } },
    { label: "new", params: { "primary_release_date.gte": "2018-01-01" } },
    { label: "classic", params: { "primary_release_date.lte": "1999-12-31" } },
  ];

  for (const lane of lanes) {
    for (let page = 1; page <= 2; page++) {
      const m = await discover("movie", page, lane.params);
      for (const r of m.results || []) all.push(await buildItem("movie", r, movieGenres));
      await sleep(220);
    }
  }

  for (let page = 1; page <= 3; page++) {
    const t = await discover("tv", page, {});
    for (const r of t.results || []) all.push(await buildItem("series", r, tvGenres));
    await sleep(220);
  }

  // Filter a bit: remove missing posters/titles and keep it reasonable.
  const cleaned = all
    .filter((x) => x.title && x.why)
    .filter((x) => x.poster?.imageUrl)
    .filter((x) => !String(x.title).toLowerCase().includes("collection"));

  const deduped = uniqBy(cleaned, (x) => x.id);

  // Merge with existing curated entries (keep them as-is).
  let existing = [];
  try {
    const raw = await fs.readFile(OUT_FILE, "utf8");
    existing = JSON.parse(raw);
  } catch {
    // ignore
  }
  const curated = (existing || []).filter((x) => typeof x?.id === "string" && !x.id.startsWith("tmdb-"));
  const merged = [...curated, ...deduped].slice(0, 260);

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");

  console.log(`Wrote ${merged.length} items to ${OUT_FILE}`);
  console.log(`- curated: ${curated.length}`);
  console.log(`- tmdb: ${merged.length - curated.length}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

