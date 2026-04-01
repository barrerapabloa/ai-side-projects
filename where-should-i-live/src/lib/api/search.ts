import { z } from "zod";
import { wikiSearch } from "@/lib/search/wikipedia";

const requestSchema = z.object({
  query: z.string().min(2).max(180),
  maxResults: z.number().int().min(1).max(8).optional(),
});

export async function handleSearchPost(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { query } = parsed.data;
  const maxResults = parsed.data.maxResults ?? 6;

  const provider = (process.env.SEARCH_PROVIDER ?? "wikipedia").toLowerCase();
  if (provider !== "wikipedia") {
    return Response.json(
      { error: "Unsupported SEARCH_PROVIDER" },
      { status: 500 },
    );
  }

  const results = await wikiSearch(query, maxResults);

  return Response.json({
    query,
    results: results.slice(0, maxResults),
    provider,
  });
}
