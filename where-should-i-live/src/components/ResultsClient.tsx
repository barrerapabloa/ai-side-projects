"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { ResultsShare } from "@/components/ResultsShare";
import { DEMO_CITIES } from "@/lib/demoCities";
import { decodeBase64UrlToJson } from "@/lib/encode";
import type { CityResult } from "@/lib/types";

type ResultsPayload = { cities?: CityResult[] };

function safeDecode(data: string | null): ResultsPayload | null {
  if (!data) return null;
  try {
    return decodeBase64UrlToJson<ResultsPayload>(data);
  } catch {
    return null;
  }
}

export function ResultsClient() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const cities = useMemo(() => {
    const payload = safeDecode(dataParam);
    if (payload?.cities && payload.cities.length === 3) return payload.cities;
    return DEMO_CITIES;
  }, [dataParam]);

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
