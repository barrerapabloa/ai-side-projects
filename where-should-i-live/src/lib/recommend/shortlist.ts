import type { QuizAnswers, SeedCity } from "@/lib/types";
import { scoreCity } from "@/lib/recommend/scoring";

export function shortlistCities(
  seed: SeedCity[],
  answers: QuizAnswers,
  limit = 10,
): Array<SeedCity & { score: number }> {
  return seed
    .map((c) => ({ ...c, score: scoreCity(c, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

