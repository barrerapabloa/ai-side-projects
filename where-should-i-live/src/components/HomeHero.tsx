"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { QuizClient } from "@/components/QuizClient";
import { ResultsCardStack } from "@/components/ResultsCardStack";
import { ScrambleHover } from "@/components/ScrambleHover";
import type { CityResult } from "@/lib/types";

export function HomeHero() {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<CityResult[]>([]);

  const hasResults = cities.length === 3;

  return (
    <>
      <div
        className={cx(
          "mx-auto flex w-full max-w-5xl flex-col",
          /* Results: start from top so card height never recenters the hero (main is justify-start). */
          hasResults ? "pt-2 sm:pt-4" : "min-h-[calc(100dvh-6.5rem)] justify-center",
        )}
      >
        {!hasResults ? (
          <div className="-translate-y-12">
            <div className="text-center">
              <h1 className="serifTitle mt-6 text-[64px] leading-[0.9] sm:text-[112px]">
                <ScrambleHover
                  lines={["Where should", "I live?"]}
                  scrambleSpeed={44}
                  scrambledClassName="text-ink/35"
                />
              </h1>
              <p className="mx-auto mt-6 max-w-[min(100%,44ch)] px-1 text-center text-[16px] leading-relaxed text-muted text-pretty sm:max-w-[56ch] sm:leading-[1.9]">
                Answer a few questions.{" "}
                <br className="sm:hidden" />
                We’ll return three cities with grounded context and sources.
              </p>
              {!open ? (
                <div className="mt-10 flex justify-center">
                  <Button onClick={() => setOpen(true)}>Get started</Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="serifTitle mt-1 text-[44px] leading-[0.95] sm:mt-2 sm:text-[52px]">
                Your top cities
              </h2>
              <p className="mx-auto mt-2 max-w-[42ch] text-[15px] leading-relaxed text-muted sm:mt-2.5">
                Three picks in a stack—tap to expand, tap again to fold
                <br />
                and choose another.
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:mt-5">
              <ResultsCardStack cities={cities} />
              <div className="mt-6 flex justify-center px-4 pb-8 sm:mt-8 sm:pb-10">
                <Button type="button" onClick={() => setCities([])}>
                  Start over
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal title="Quiz" open={open} onClose={() => setOpen(false)}>
        <QuizClient
          stableModalHeight
          onExit={() => setOpen(false)}
          onResults={(c) => {
            setCities(c);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
