import { z } from "zod";

export type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function uniqueByUrl(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const url = normalizeUrl(r.url);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ ...r, url });
  }
  return out;
}

export async function tavilySearch(
  query: string,
  maxResults: number,
): Promise<SearchResult[] | null> {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      results: z
        .array(
          z.object({
            title: z.string(),
            url: z.string(),
            content: z.string().optional(),
          }),
        )
        .default([]),
    })
    .safeParse(json);
  if (!parsed.success) return null;

  return parsed.data.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

