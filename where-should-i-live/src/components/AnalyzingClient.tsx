"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeBase64UrlToJson, encodeJsonToBase64Url } from "@/lib/encode";
import { apiUrl } from "@/lib/site";
import type { CityResult, QuizAnswers } from "@/lib/types";

type AnswersPayload = { answers?: QuizAnswers };

export function AnalyzingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "starting" | "searching" | "thinking" | "routing"
  >("starting");

  const answers = useMemo(() => {
    if (!dataParam) return null;
    try {
      const payload = decodeBase64UrlToJson<AnswersPayload>(dataParam);
      return payload.answers ?? null;
    } catch {
      return null;
    }
  }, [dataParam]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!answers) {
        setError("Missing answers. Go back and try again.");
        return;
      }
      try {
        setStatus("searching");
        const res = await fetch(apiUrl("/api/recommend"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) throw new Error("recommend_failed");
        setStatus("thinking");
        const json = (await res.json()) as { cities: CityResult[] };
        if (cancelled) return;
        const data = encodeJsonToBase64Url({ answers, cities: json.cities });
        setStatus("routing");
        router.replace(`/results?data=${encodeURIComponent(data)}`);
      } catch {
        if (cancelled) return;
        setError("Couldn’t generate results right now. Please try again.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [answers, router]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-xs text-muted">Analyzing your life…</div>
      <div className="serifTitle mt-3 text-[36px] font-normal leading-[1.05]">
        Finding your cities
      </div>
      <div className="mt-3 max-w-[56ch] text-sm leading-6 text-muted">
        {status === "starting"
          ? "Warming up."
          : status === "searching"
            ? "Pulling fresh context from the web."
            : status === "thinking"
              ? "Synthesizing your top matches."
              : "Opening results."}
      </div>

      <div className="mt-7 w-full">
        <div className="h-2 w-full overflow-hidden rounded-full border border-line bg-white/45 backdrop-blur">
          <div
            className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#1d7bff] via-[#60a5fa] to-white/90"
            style={{
              transform: "translateX(-35%)",
              animation: "progress-sweep 1.05s ease-in-out infinite",
            }}
          />
        </div>
        <div className="mt-2 text-[11px] text-muted">
          Using free sources (Wikipedia + Open‑Meteo).
        </div>
      </div>

      {error ? (
        <div className="mt-7 w-full rounded-xl border border-line bg-white/55 px-4 py-3 text-sm text-ink/80 backdrop-blur">
          {error}
          <div className="mt-3 flex justify-center gap-3">
            <Link href="/quiz">
              <button className="h-10 rounded-none border border-line bg-white px-4 text-[12px] font-medium tracking-wide text-ink/85 transition hover:border-black/40">
                Back to quiz
              </button>
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-10 rounded-none border border-line bg-white px-4 text-[12px] font-medium tracking-wide text-ink/85 transition hover:border-black/40"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

