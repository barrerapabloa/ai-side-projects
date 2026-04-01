"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/Button";
import { cx } from "@/lib/cx";
import type {
  ClimatePreference,
  LifestylePreference,
  QuizAnswers,
  SafetyImportance,
} from "@/lib/types";

type StepId =
  | "budget"
  | "remoteIncome"
  | "climate"
  | "lifestyle"
  | "safety"
  | "region";

type Step = {
  id: StepId;
  title: string;
  helper?: string;
};

const steps: Step[] = [
  {
    id: "budget",
    title: "Monthly budget (USD)",
    helper: "Rough estimate is perfect.",
  },
  {
    id: "remoteIncome",
    title: "Do you have remote income?",
    helper: "If yes, we’ll bias toward places that are easier without local employment.",
  },
  {
    id: "climate",
    title: "Preferred climate",
    helper: "This helps anchor both vibe and seasonality.",
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    helper: "Pick the default you’d want day-to-day.",
  },
  {
    id: "safety",
    title: "How important is safety?",
    helper: "We’ll weigh this more heavily when it’s a top priority.",
  },
  {
    id: "region",
    title: "Region preference (optional)",
    helper: "Leave blank if you’re open to anywhere.",
  },
];

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function parseBudgetUsd(input: string): number | null {
  const cleaned = input.replaceAll(/[^0-9]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return clampInt(n, 200, 100000);
}

function ChoicePill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-10 rounded-none border px-4 text-sm font-medium transition",
        "flex items-center justify-center gap-2",
        active
          ? "border-black bg-white text-ink"
          : "border-line bg-white text-ink/85 hover:border-black/40",
      )}
    >
      {active ? <span className="h-2 w-2 rounded-full bg-black" /> : null}
      {children}
    </button>
  );
}

export function QuizFlow({
  onSubmit,
  onExit,
  isSubmitting,
  error,
  stableModalHeight = false,
}: {
  onSubmit: (answers: QuizAnswers) => void;
  onExit?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  stableModalHeight?: boolean;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx]!;

  const [budgetInput, setBudgetInput] = useState("3000");
  const [remoteIncome, setRemoteIncome] = useState<boolean | null>(null);
  const [climate, setClimate] = useState<ClimatePreference | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestylePreference | null>(null);
  const [safety, setSafety] = useState<SafetyImportance | null>(3);
  const [regionPreference, setRegionPreference] = useState("");

  const budgetUsd = useMemo(() => parseBudgetUsd(budgetInput), [budgetInput]);

  const canContinue = useMemo(() => {
    switch (step.id) {
      case "budget":
        return budgetUsd !== null;
      case "remoteIncome":
        return remoteIncome !== null;
      case "climate":
        return climate !== null;
      case "lifestyle":
        return lifestyle !== null;
      case "safety":
        return safety !== null;
      case "region":
        return true;
    }
  }, [budgetUsd, climate, lifestyle, remoteIncome, safety, step.id]);

  function goNext() {
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  function handleContinue() {
    if (!canContinue) return;
    if (step.id !== "region") {
      goNext();
      return;
    }

    if (
      budgetUsd === null ||
      remoteIncome === null ||
      climate === null ||
      lifestyle === null ||
      safety === null
    ) {
      return;
    }

    const answers: QuizAnswers = {
      monthlyBudgetUsd: budgetUsd,
      remoteIncome,
      climate,
      lifestyle,
      safetyImportance: safety,
      regionPreference: regionPreference.trim() ? regionPreference.trim() : undefined,
    };
    onSubmit(answers);
  }

  return (
    <div
      className={cx(
        "flex flex-col",
        stableModalHeight &&
          /* Fill the modal body so mt-auto on the footer hits the real bottom; min-h ≈ step 5 (safety). */
          "min-h-[432px] flex-1 sm:min-h-[448px]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          Step {stepIdx + 1} of {steps.length}
        </div>
        <button
          type="button"
          onClick={() => onExit?.()}
          disabled={isSubmitting}
          className="text-xs text-ink/70 underline decoration-transparent underline-offset-4 transition hover:decoration-current disabled:opacity-40"
        >
          Exit
        </button>
      </div>

      <h2 className="serifTitle mt-2 text-[30px] font-normal leading-[1.05] sm:text-[36px]">
        {step.title}
      </h2>
      {step.helper ? (
        <p className="mt-2 text-sm leading-6 text-muted">{step.helper}</p>
      ) : null}

      <div className="mt-6 sm:mt-7">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step.id === "budget" ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs text-muted">Monthly budget</div>
                  <div className="text-[13px] font-medium text-ink">
                    {budgetUsd === null ? "—" : `$${budgetUsd.toLocaleString()}`}
                    <span className="text-muted">/mo</span>
                  </div>
                </div>

                <div className="border border-line bg-white px-4 py-4">
                  <input
                    aria-label="Monthly budget slider"
                    type="range"
                    min={500}
                    max={12000}
                    step={100}
                    value={budgetUsd ?? 3000}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-full rangeSlider"
                    style={{
                      accentColor: "#0a0a0a",
                    }}
                  />
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                    <span>$500</span>
                    <span>$12,000+</span>
                  </div>
                </div>

                {budgetUsd === null ? (
                  <div className="text-xs text-muted">
                    Enter a number like 2500.
                  </div>
                ) : null}
              </div>
            ) : null}

            {step.id === "remoteIncome" ? (
              <div className="flex flex-wrap gap-2">
                <ChoicePill
                  active={remoteIncome === true}
                  onClick={() => setRemoteIncome(true)}
                >
                  Yes
                </ChoicePill>
                <ChoicePill
                  active={remoteIncome === false}
                  onClick={() => setRemoteIncome(false)}
                >
                  No
                </ChoicePill>
              </div>
            ) : null}

            {step.id === "climate" ? (
              <div className="flex flex-wrap gap-2">
                <ChoicePill
                  active={climate === "warm"}
                  onClick={() => setClimate("warm")}
                >
                  Warm
                </ChoicePill>
                <ChoicePill
                  active={climate === "cold"}
                  onClick={() => setClimate("cold")}
                >
                  Cold
                </ChoicePill>
                <ChoicePill
                  active={climate === "mixed"}
                  onClick={() => setClimate("mixed")}
                >
                  Mixed
                </ChoicePill>
              </div>
            ) : null}

            {step.id === "lifestyle" ? (
              <div className="flex flex-wrap gap-2">
                <ChoicePill
                  active={lifestyle === "city"}
                  onClick={() => setLifestyle("city")}
                >
                  City
                </ChoicePill>
                <ChoicePill
                  active={lifestyle === "chill"}
                  onClick={() => setLifestyle("chill")}
                >
                  Chill
                </ChoicePill>
                <ChoicePill
                  active={lifestyle === "nature"}
                  onClick={() => setLifestyle("nature")}
                >
                  Nature
                </ChoicePill>
                <ChoicePill
                  active={lifestyle === "party"}
                  onClick={() => setLifestyle("party")}
                >
                  Party
                </ChoicePill>
              </div>
            ) : null}

            {step.id === "safety" ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500/80" />
                    1 (low)
                  </span>
                  <span className="text-ink/70">
                    {safety ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    5 (high)
                    <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                  </span>
                </div>

                <div className="border border-line bg-white px-4 py-4">
                  <input
                    aria-label="Safety importance (1 to 5)"
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={safety ?? 3}
                    onChange={(e) =>
                      setSafety(Number(e.target.value) as SafetyImportance)
                    }
                    className="w-full rangeSafety"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(239,68,68,0.85), rgba(245,158,11,0.85), rgba(16,185,129,0.85))",
                      height: 6,
                      appearance: "none",
                    }}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>Risk tolerant</span>
                    <span>Balanced</span>
                    <span>Safety first</span>
                  </div>
                </div>
              </div>
            ) : null}

            {step.id === "region" ? (
              <div className="flex flex-col gap-2">
                <input
                  aria-label="Region preference"
                  placeholder="e.g. Europe, Asia, South America"
                  value={regionPreference}
                  onChange={(e) => setRegionPreference(e.target.value)}
                  className="h-11 w-full rounded-none border border-line bg-white px-4 text-sm text-ink placeholder:text-ink/40"
                />
                <div className="text-xs text-muted">
                  Optional. Leave blank if you’re open to anywhere.
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {error ? (
        <div className="mt-4 shrink-0 rounded-xl border border-line bg-white/55 px-4 py-3 text-sm text-ink/80 backdrop-blur">
          {error}
        </div>
      ) : null}

      <div
        className={cx(
          "grid grid-cols-2 gap-3",
          stableModalHeight ? "mt-auto shrink-0 pt-6 sm:pt-7" : "mt-6 sm:mt-7",
        )}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={stepIdx === 0 || isSubmitting}
          className="h-11 w-full rounded-none border border-line bg-white px-4 text-sm font-medium text-ink/85 transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isSubmitting}
          className="h-11 w-full justify-center"
        >
          {step.id === "region"
            ? isSubmitting
              ? "Finding…"
              : "See results"
            : "Continue"}
        </Button>
      </div>
    </div>
  );
}

