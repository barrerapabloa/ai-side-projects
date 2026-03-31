"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizFlow } from "@/components/QuizFlow";
import type { CityResult, QuizAnswers } from "@/lib/types";

export function QuizClient({
  onExit,
  onResults,
  /** When true (e.g. homepage modal), reserve vertical space so steps don’t resize the shell. */
  stableModalHeight = false,
}: {
  onExit?: () => void;
  onResults?: (cities: CityResult[], answers: QuizAnswers) => void;
  stableModalHeight?: boolean;
} = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(answers: QuizAnswers) {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("recommend_failed");
      const json = (await res.json()) as { cities: CityResult[] };

      if (onResults) {
        onResults(json.cities, answers);
        setIsSubmitting(false);
        return;
      }

      // Fallback: if used outside the homepage modal, still go to /results
      // (keeps the old route usable).
      router.push("/results");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <QuizFlow
      stableModalHeight={stableModalHeight}
      onSubmit={handleSubmit}
      onExit={() => {
        if (onExit) onExit();
        else router.push("/");
      }}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}

