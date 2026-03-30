"use client";

import { SwipeCarousel } from "@/components/SwipeCarousel";
import underratedRaw from "@/data/underrated.json";
import {
  buildProfile,
  pickTopDiverse,
  stableGradientFromId,
  type QuizAnswers,
  type TitleItem,
} from "@/lib/quiz";
import { useMemo, useRef, useState } from "react";

const GENRES = [
  "sci-fi",
  "thriller",
  "comedy",
  "drama",
  "romance",
  "horror",
  "animation",
  "documentary",
] as const;

type Genre = (typeof GENRES)[number];

type StepId = keyof QuizAnswers;

const STEPS: Array<{ id: StepId; label: string; hint?: string }> = [
  { id: "format", label: "Format", hint: "Pick what you’re in the mood for." },
  { id: "genres", label: "Genres", hint: "Choose up to 3." },
  { id: "pace", label: "Pace", hint: "How should it move?" },
  { id: "tone", label: "Tone", hint: "What feeling do you want?" },
  { id: "era", label: "Era", hint: "When should it be from?" },
];

const DEFAULT_ANSWERS: QuizAnswers = {
  format: null,
  genres: [],
  pace: null,
  tone: null,
  era: null,
};

const underrated = underratedRaw as TitleItem[];

export default function Home() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_ANSWERS);
  const [view, setView] = useState<"quiz" | "results">("quiz");

  const step = STEPS[stepIdx]!;
  const progressLabel = `${String(stepIdx + 1).padStart(2, "0")} / 05`;

  const profile = useMemo(() => buildProfile(answers), [answers]);
  const seed = useMemo(() => JSON.stringify(answers), [answers]);
  const underratedPicks = useMemo(
    () => pickTopDiverse(profile, underrated, Math.min(8, underrated.length), seed),
    [profile, seed],
  );

  const canNext = useMemo(() => {
    if (step.id === "format") return answers.format != null;
    if (step.id === "genres") return answers.genres.length > 0;
    if (step.id === "pace") return answers.pace != null;
    if (step.id === "tone") return answers.tone != null;
    if (step.id === "era") return answers.era != null;
    return true;
  }, [answers.era, answers.format, answers.genres.length, answers.pace, answers.tone, step.id]);

  const reset = () => {
    setAnswers(DEFAULT_ANSWERS);
    setStepIdx(0);
    setView("quiz");
  };

  const onNext = () => {
    if (view === "quiz") {
      if (!canNext) return;
      if (stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1);
      else setView("results");
      return;
    }

    // Results screen: "Retake"
    reset();
  };

  const onBack = () => {
    if (view === "results") {
      setView("quiz");
      setStepIdx(STEPS.length - 1);
      return;
    }
    setStepIdx((i) => Math.max(0, i - 1));
  };

  return (
    <div className="app-shell">
      {view !== "results" ? <RadarHud /> : null}
      <div
        className={`mx-auto min-h-[100dvh] px-8 py-16 ${
          view === "results"
            ? "max-w-[1280px]"
            : "grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-14"
        }`}
      >
        {view !== "results" ? <LeftCopy /> : null}

        <div
          className={`flex min-h-0 flex-col items-stretch ${
            view === "results"
              ? "mx-auto w-full max-w-[980px] lg:pt-12"
              : "lg:pt-20"
          }`}
        >
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--text-faint)]">
                REELRADAR
              </p>
              {view === "quiz" ? (
                <p className="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">
                  Answer 5 questions about movies and shows you like.
                </p>
              ) : null}
            </div>

            <div className="shrink-0 text-right">
              <div className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(232,234,238,0.12)] bg-[rgba(232,234,238,0.03)] px-3 py-1.5">
                <span className="text-[11px] font-semibold tracking-[0.12em] text-[rgba(232,234,238,0.66)]">
                  {progressLabel}
                </span>
              </div>
            </div>
          </header>

          <div className="mt-6">
            {view === "quiz" ? (
              <QuizStep
                stepId={step.id}
                label={step.label}
                hint={step.hint}
                answers={answers}
                setAnswers={setAnswers}
              />
            ) : (
              <Results
                answers={answers}
                underratedPicks={underratedPicks}
              />
            )}
          </div>

          <footer className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[rgba(232,234,238,0.12)] bg-[rgba(232,234,238,0.03)] px-4 text-[13px] font-semibold text-[var(--text)] transition hover:bg-[rgba(232,234,238,0.06)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-full border border-transparent bg-transparent px-3 text-[13px] font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={view === "quiz" ? !canNext : false}
              className={`inline-flex h-10 items-center justify-center rounded-[10px] px-5 text-[13px] font-semibold transition ${
                view === "quiz" && !canNext
                  ? "cursor-not-allowed bg-[rgba(232,234,238,0.06)] text-[rgba(232,234,238,0.45)]"
                  : "bg-[rgba(232,234,238,0.92)] text-[#0b0c0f] hover:bg-[rgba(232,234,238,0.84)]"
              }`}
            >
              {view === "results"
                ? "Retake"
                : stepIdx === STEPS.length - 1
                  ? "Reveal"
                  : "Next"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function LeftCopy() {
  return (
    <div className="lg:sticky lg:top-16">
      <p className="text-[12px] font-semibold tracking-[-0.02em] text-[var(--text)]">
        ReelRadar
      </p>
      <h1 className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--text)] sm:text-[54px]">
        Studio‑quality
        <br />
        recommendations.
        <br />
        Without the scroll.
      </h1>
      <p className="mt-5 max-w-[46ch] text-[15px] leading-7 text-[var(--text-muted)]">
        Tell us what you like in five quick picks. We’ll reveal underrated gems
        you may have never seen.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-faint)]">
        <span className="inline-flex items-center gap-2">
          <IconClock />
          30 seconds
        </span>
        <span className="inline-flex items-center gap-2">
          <IconUser />
          No account
        </span>
        <span className="inline-flex items-center gap-2">
          <IconSwipe />
          Swipe/drag reveal
        </span>
      </div>
    </div>
  );
}

function RadarHud() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-0">
      <div className="radar-bare" aria-hidden>
        <div className="radar__ring" />
        <div className="radar__sweep" />
        <div className="radar__ping" />
        <div className="radar__dot" />
      </div>
    </div>
  );
}

// Intentionally removed: previous left-side mosaic for "discovery" styling.

function IconClock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[rgba(232,234,238,0.55)]"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[rgba(232,234,238,0.55)]"
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconSwipe() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[rgba(232,234,238,0.55)]"
      aria-hidden
    >
      <path d="M7 12h10" />
      <path d="M10 9l-3 3 3 3" />
      <path d="M14 9l3 3-3 3" />
    </svg>
  );
}

function QuizStep({
  stepId,
  label,
  hint,
  answers,
  setAnswers,
}: {
  stepId: StepId;
  label: string;
  hint?: string;
  answers: QuizAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuizAnswers>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[12px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
          {label.toUpperCase()}
        </p>
        {hint ? (
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-muted)]">
            {hint}
          </p>
        ) : null}
      </div>

      {stepId === "format" ? (
        <ChipGroup
          value={answers.format}
          options={[
            { id: "movie", label: "Movies" },
            { id: "series", label: "TV series" },
            { id: "both", label: "Both" },
          ]}
          onChange={(v) =>
            setAnswers((a) => ({ ...a, format: v as QuizAnswers["format"] }))
          }
        />
      ) : null}

      {stepId === "genres" ? (
        <MultiChipGroup
          value={answers.genres}
          max={3}
          options={GENRES.map((g) => ({ id: g, label: prettyGenre(g) }))}
          onChange={(next) =>
            setAnswers((a) => ({ ...a, genres: next as Genre[] }))
          }
          helper={`Selected ${answers.genres.length}/3`}
        />
      ) : null}

      {stepId === "pace" ? (
        <ChipGroup
          value={answers.pace}
          options={[
            { id: "slow", label: "Slow-burn" },
            { id: "balanced", label: "Balanced" },
            { id: "fast", label: "Fast" },
          ]}
          onChange={(v) =>
            setAnswers((a) => ({ ...a, pace: v as QuizAnswers["pace"] }))
          }
        />
      ) : null}

      {stepId === "tone" ? (
        <ChipGroup
          value={answers.tone}
          options={[
            { id: "feelgood", label: "Feel-good" },
            { id: "dark", label: "Dark" },
            { id: "mindbending", label: "Mind-bending" },
            { id: "grounded", label: "Grounded" },
          ]}
          onChange={(v) =>
            setAnswers((a) => ({ ...a, tone: v as QuizAnswers["tone"] }))
          }
        />
      ) : null}

      {stepId === "era" ? (
        <ChipGroup
          value={answers.era}
          options={[
            { id: "new", label: "2018+" },
            { id: "modern", label: "2000–2017" },
            { id: "classic", label: "Pre‑2000" },
            { id: "any", label: "Any era" },
          ]}
          onChange={(v) =>
            setAnswers((a) => ({ ...a, era: v as QuizAnswers["era"] }))
          }
        />
      ) : null}
    </div>
  );
}

function Results({
  answers,
  underratedPicks,
}: {
  answers: QuizAnswers;
  underratedPicks: TitleItem[];
}) {
  const topGenres = answers.genres.slice(0, 2).map(prettyGenre).join(" + ");
  return (
    <div className="space-y-7">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[12px] text-[var(--text-muted)]">
        <span className="font-semibold text-[rgba(255,255,255,0.65)]">
          Tuned for
        </span>
        <span className="truncate">
          <span className="text-[var(--text)]">{topGenres || "your vibe"}</span>
          {answers.tone ? ` · ${prettyTone(answers.tone)}` : ""}
          {answers.pace ? ` · ${prettyPace(answers.pace)}` : ""}
        </span>
      </div>

      <SwipeCarousel
        title={<span className="text-[28px] sm:text-[34px]">Underrated (new-to-you)</span>}
        subtitle="Low-hype, high-reward picks that match your taste."
      >
        {underratedPicks.map((t) => (
          <BigTitleCard key={t.id} item={t} />
        ))}
      </SwipeCarousel>
    </div>
  );
}

function BigTitleCard({ item }: { item: TitleItem }) {
  const g = stableGradientFromId(item.id);
  const accent = item.poster?.accent ?? g.from;
  const format = item.format === "series" ? "Series" : "Movie";

  return (
    <article className="snap-item w-[84vw] max-w-[520px] shrink-0 lg:w-[460px] lg:max-w-none">
      <div className="group relative rounded-[28px]">
        <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.10)] bg-[#0c0c11] p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_70px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
            <div
              className="absolute -left-16 -top-14 h-44 w-44 rounded-full blur-3xl"
              style={{ background: `${accent}33` }}
            />
            <div
              className="absolute -right-20 bottom-6 h-44 w-44 rounded-full blur-3xl"
              style={{ background: `${g.to}24` }}
            />
          </div>

          <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[rgba(255,255,255,0.55)]">
                {format}
                {item.upcoming?.window ? ` · ${item.upcoming.window}` : ""}
              </p>
              <h4 className="mt-2 title-serif text-[24px] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                {item.title}
              </h4>
              <p className="mt-2 text-[13px] leading-6 text-[rgba(255,255,255,0.64)]">
                {item.why}
              </p>
            </div>

            {item.year ? (
              <div className="shrink-0 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(255,255,255,0.72)]">
                {item.year}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Poster
              id={item.id}
              title={item.title}
              from={g.from}
              to={g.to}
              imageUrl={item.poster?.imageUrl}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {extractChips(item.tags).slice(0, 3).map((c) => (
              <span
                key={c}
                className="rounded-[10px] border border-[rgba(232,234,238,0.10)] bg-[rgba(232,234,238,0.03)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(232,234,238,0.70)]"
              >
                {c}
              </span>
            ))}
            {item.links?.imdb ? (
              <a
                href={item.links.imdb}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-2 rounded-[10px] border border-[rgba(232,234,238,0.12)] bg-[rgba(232,234,238,0.03)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(232,234,238,0.82)] transition hover:bg-[rgba(232,234,238,0.06)]"
              >
                IMDb
                <ExternalArrow />
              </a>
            ) : item.links?.tmdb ? (
              <a
                href={item.links.tmdb}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-2 rounded-[10px] border border-[rgba(232,234,238,0.12)] bg-[rgba(232,234,238,0.03)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(232,234,238,0.82)] transition hover:bg-[rgba(232,234,238,0.06)]"
              >
                TMDB
                <ExternalArrow />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </article>
  );
}

function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M7 17L17 7" />
      <path d="M10 7h7v7" />
    </svg>
  );
}

function Poster({
  id,
  title,
  from,
  to,
  imageUrl,
}: {
  id: string;
  title: string;
  from: string;
  to: string;
  imageUrl?: string;
}) {
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  return (
    <div
      ref={tiltRef}
      className="poster-tilt relative grid aspect-[2/3] w-[190px] place-items-end overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.16)] p-4"
      style={{
        background: imageUrl
          ? `linear-gradient(160deg, ${from} 0%, ${to} 65%, rgba(255,255,255,0.06) 120%)`
          : `linear-gradient(160deg, ${from} 0%, ${to} 65%, rgba(255,255,255,0.06) 120%)`,
        boxShadow:
          "0 28px 65px rgba(0,0,0,0.55), 0 12px 28px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.08) inset",
      }}
      aria-label={`Poster for ${title}`}
      onPointerMove={(e) => {
        const el = tiltRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const dx = (px - 0.5) * 2;
        const dy = (py - 0.5) * 2;

        const tiltY = Math.max(-1, Math.min(1, dx)) * 12;
        const tiltX = Math.max(-1, Math.min(1, -dy)) * 10;

        if (raf.current != null) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          el.style.setProperty("--tiltX", `${tiltX}deg`);
          el.style.setProperty("--tiltY", `${tiltY}deg`);
          el.style.setProperty("--tiltLift", `-10px`);
          el.style.setProperty("--tiltScale", `1.03`);
          el.style.setProperty("--shineX", `${Math.round(px * 100)}%`);
          el.style.setProperty("--shineY", `${Math.round(py * 100)}%`);
        });
      }}
      onPointerLeave={() => {
        const el = tiltRef.current;
        if (!el) return;
        if (raf.current != null) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          el.style.setProperty("--tiltX", `0deg`);
          el.style.setProperty("--tiltY", `0deg`);
          el.style.setProperty("--tiltLift", `0px`);
          el.style.setProperty("--tiltScale", `1`);
          el.style.setProperty("--shineX", `50%`);
          el.style.setProperty("--shineY", `35%`);
        });
      }}
      onPointerDown={() => {
        const el = tiltRef.current;
        if (!el) return;
        el.style.setProperty("--tiltLift", `-6px`);
        el.style.setProperty("--tiltScale", `1.008`);
      }}
      onPointerUp={() => {
        const el = tiltRef.current;
        if (!el) return;
        el.style.setProperty("--tiltScale", `1.02`);
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          draggable={false}
        />
      ) : null}

      <div className="absolute inset-0 opacity-[0.14]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.65), transparent 45%)",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[46%]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.28) 38%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full">
        <p className="line-clamp-3 text-[12px] font-semibold leading-5 text-[rgba(255,255,255,0.92)]">
          {title}
        </p>
      </div>

      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-28 bg-gradient-to-t from-[rgba(0,0,0,0.45)] to-transparent" />
    </div>
  );
}

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`inline-flex h-11 w-full items-center justify-start rounded-[10px] border px-4 text-[13px] font-semibold transition ${
              on
                ? "border-[rgba(232,234,238,0.24)] bg-[rgba(232,234,238,0.10)] text-[var(--text)]"
                : "border-[rgba(232,234,238,0.10)] bg-[rgba(232,234,238,0.03)] text-[var(--text)] hover:bg-[rgba(232,234,238,0.06)]"
            }`}
            aria-pressed={on}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiChipGroup({
  value,
  options,
  max,
  onChange,
  helper,
}: {
  value: string[];
  options: Array<{ id: string; label: string }>;
  max: number;
  onChange: (next: string[]) => void;
  helper?: string;
}) {
  const set = new Set(value);
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const on = set.has(o.id);
          const atMax = !on && set.size >= max;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                const next = new Set(set);
                if (next.has(o.id)) next.delete(o.id);
                else if (next.size < max) next.add(o.id);
                onChange(Array.from(next));
              }}
              className={`inline-flex h-11 w-full items-center justify-start rounded-[10px] border px-4 text-[13px] font-semibold transition ${
                on
                  ? "border-[rgba(232,234,238,0.24)] bg-[rgba(232,234,238,0.10)] text-[var(--text)]"
                  : atMax
                    ? "cursor-not-allowed border-[rgba(232,234,238,0.06)] bg-[rgba(232,234,238,0.02)] text-[rgba(232,234,238,0.36)]"
                    : "border-[rgba(232,234,238,0.10)] bg-[rgba(232,234,238,0.03)] text-[var(--text)] hover:bg-[rgba(232,234,238,0.06)]"
              }`}
              aria-pressed={on}
              disabled={atMax}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {helper ? (
        <p className="text-[12px] text-[var(--text-faint)]">{helper}</p>
      ) : null}
    </div>
  );
}

function prettyGenre(g: string) {
  if (g === "sci-fi") return "Sci‑fi";
  return g.slice(0, 1).toUpperCase() + g.slice(1);
}

function prettyPace(p: NonNullable<QuizAnswers["pace"]>) {
  if (p === "slow") return "slow-burn";
  if (p === "fast") return "fast";
  return "balanced";
}

function prettyTone(t: NonNullable<QuizAnswers["tone"]>) {
  if (t === "feelgood") return "feel-good";
  if (t === "mindbending") return "mind-bending";
  return t;
}

function extractChips(tags: string[]) {
  const nice: string[] = [];
  const want = ["genre:", "tone:", "pace:"];
  for (const t of tags) {
    const prefix = want.find((p) => t.startsWith(p));
    if (!prefix) continue;
    const v = t.slice(prefix.length);
    if (prefix === "genre:") nice.push(prettyGenre(v));
    else if (prefix === "tone:") nice.push(prettyTone(v as NonNullable<QuizAnswers["tone"]>));
    else if (prefix === "pace:") nice.push(prettyPace(v as NonNullable<QuizAnswers["pace"]>));
  }
  return Array.from(new Set(nice));
}
