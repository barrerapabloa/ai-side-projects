import { z } from "zod";

export type WikiSearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

export type WikiSummary = {
  title: string;
  url: string;
  extract: string;
  thumbnailUrl?: string;
};

export async function wikiSearch(
  query: string,
  limit = 5,
): Promise<WikiSearchResult[]> {
  const url = new URL("https://en.wikipedia.org/w/rest.php/v1/search/title");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      "accept": "application/json",
      "user-agent": "HomeCompass/1.0 (where-should-i-live)",
    },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      pages: z
        .array(
          z.object({
            title: z.string(),
            key: z.string(),
            description: z.string().optional(),
            excerpt: z.string().optional(),
          }),
        )
        .default([]),
    })
    .safeParse(json);
  if (!parsed.success) return [];

  return parsed.data.pages.slice(0, limit).map((p) => ({
    title: p.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.key)}`,
    snippet: p.description ?? p.excerpt,
  }));
}

export async function wikiSummary(titleOrKey: string): Promise<WikiSummary | null> {
  const key = encodeURIComponent(titleOrKey.replaceAll(" ", "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${key}`;
  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "HomeCompass/1.0 (where-should-i-live)",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      title: z.string(),
      extract: z.string().default(""),
      thumbnail: z
        .object({
          source: z.string().url(),
        })
        .optional(),
      content_urls: z
        .object({
          desktop: z.object({ page: z.string().url() }),
        })
        .optional(),
    })
    .safeParse(json);
  if (!parsed.success) return null;
  return {
    title: parsed.data.title,
    extract: parsed.data.extract,
    url: parsed.data.content_urls?.desktop.page ?? `https://en.wikipedia.org/wiki/${key}`,
    thumbnailUrl: parsed.data.thumbnail?.source,
  };
}

