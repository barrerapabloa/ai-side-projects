import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { ResultsShare } from "@/components/ResultsShare";
import { decodeBase64UrlToJson } from "@/lib/encode";
import type { CityResult } from "@/lib/types";

type ResultsPayload = {
  cities?: CityResult[];
};

function safeDecode(data: string | null): ResultsPayload | null {
  if (!data) return null;
  try {
    return decodeBase64UrlToJson<ResultsPayload>(data);
  } catch {
    return null;
  }
}

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { data?: string };
}) {
  const dataParam: string | null = searchParams?.data ?? null;
  const payload = safeDecode(dataParam);
  const cities =
    payload?.cities && payload.cities.length === 3
      ? payload.cities
      : ([
          {
            name: "Lisbon",
            country: "Portugal",
            summary:
              "Sun, walkability, strong remote-worker scene, and a balanced pace.",
            cost: "$$",
            whyItMatches: [
              "Warm climate",
              "City + chill lifestyle",
              "Good remote fit",
            ],
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
              { title: "Local guides (highlights)", url: "https://www.lonelyplanet.com/" },
            ],
          },
        ] satisfies CityResult[]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[486px] pt-14 sm:pt-18">
        <div className="mb-6">
          <div className="text-xs text-muted">Results</div>
          <h2 className="serifTitle mt-1 text-[44px] font-normal leading-[0.98]">
            Your top cities
          </h2>
        </div>

        <div className="grid gap-3">
          {cities.map((c, idx) => (
            <Card key={`${c.name}-${c.country}`} className="px-5 py-5">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs text-muted">{idx + 1} of 3</div>
                  <div className="mt-1 text-[20px] font-medium tracking-[-0.01em]">
                    {c.name}, <span className="text-ink/70">{c.country}</span>
                  </div>
                  <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted">
                    {c.summary}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {c.whyItMatches.map((w) => (
                  <div
                    key={w}
                    className="border border-line bg-white px-3 py-2 text-xs text-ink/80"
                  >
                    {w}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <ResultsShare dataParam={dataParam} />
        </div>
      </div>
    </AppShell>
  );
}

