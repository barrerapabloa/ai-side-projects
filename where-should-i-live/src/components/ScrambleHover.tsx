"use client";

/**
 * Scrambles headline text on hover (Fancy Scramble Hover–style).
 * https://www.fancycomponents.dev/docs/components/text/scramble-hover
 */
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/lib/cx";

const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function rng(seed: number, i: number) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickFromPool(pool: string, seed: number, i: number) {
  const r = rng(seed, i);
  const idx = Math.floor(r * pool.length);
  return pool[Math.min(idx, pool.length - 1)] ?? "?";
}

function scannableIndices(target: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < target.length; i++) {
    const c = target[i]!;
    if (c !== " " && c !== "\n" && c !== "\r") out.push(i);
  }
  return out;
}

function lockOrder(
  indices: number[],
  revealDirection: "start" | "end" | "center",
): number[] {
  const n = indices.length;
  if (revealDirection === "start") return [...indices];
  if (revealDirection === "end") return [...indices].reverse();
  const mid = (n - 1) / 2;
  return [...indices]
    .map((strIdx, orderIdx) => ({ strIdx, orderIdx, d: Math.abs(orderIdx - mid) }))
    .sort((a, b) => a.d - b.d || a.orderIdx - b.orderIdx)
    .map((x) => x.strIdx);
}

export function ScrambleHover({
  text,
  lines,
  className,
  scrambledClassName,
  scrambleSpeed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = true,
  characters = DEFAULT_CHARS,
}: {
  text?: string;
  lines?: string[];
  className?: string;
  scrambledClassName?: string;
  scrambleSpeed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
}) {
  const lineList = useMemo(() => lines ?? (text ? [text] : []), [lines, text]);
  const target = useMemo(() => lineList.join("\n"), [lineList]);
  const reduceMotion = useReducedMotion();

  const pool = useMemo(() => {
    if (!useOriginalCharsOnly) return characters;
    const u = new Set<string>();
    for (const ch of target) {
      if (ch !== " " && ch !== "\n" && ch !== "\r") u.add(ch);
    }
    const s = [...u].join("");
    return s.length ? s : characters;
  }, [characters, target, useOriginalCharsOnly]);

  const indices = useMemo(() => scannableIndices(target), [target]);
  const order = useMemo(
    () => (sequential ? lockOrder(indices, revealDirection) : indices),
    [indices, revealDirection, sequential],
  );

  const [frame, setFrame] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullLabel = lineList.join(" ");

  const lockedCount = useMemo(() => {
    if (!hovering || reduceMotion === true) return order.length;
    if (frame >= maxIterations) return order.length;
    return Math.floor((frame / maxIterations) * order.length);
  }, [frame, hovering, maxIterations, order.length, reduceMotion]);

  const lockedSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < lockedCount; i++) {
      const idx = order[i];
      if (idx !== undefined) s.add(idx);
    }
    return s;
  }, [lockedCount, order]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startScramble = useCallback(() => {
    if (reduceMotion === true) return;
    clearTimer();
    setFrame(0);
    setHovering(true);
    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= maxIterations) {
          clearTimer();
        }
        return next;
      });
    }, scrambleSpeed);
  }, [clearTimer, maxIterations, reduceMotion, scrambleSpeed]);

  const stopScramble = useCallback(() => {
    clearTimer();
    setHovering(false);
    setFrame(0);
  }, [clearTimer]);

  function charAt(i: number): string {
    const tc = target[i]!;
    if (tc === "\n" || tc === " " || tc === "\r") return tc;
    if (lockedSet.has(i)) return tc;
    return pickFromPool(pool, frame * 131 + i * 17, i);
  }

  if (lineList.length === 0) return null;

  const segments = target.split("").map((tc, i) => {
    if (tc === "\n") return { br: true as const, i };
    const locked = lockedSet.has(i) || tc === " " || tc === "\r";
    return { br: false as const, i, ch: charAt(i), locked };
  });

  const lineBlocks: { chars: { ch: string; locked: boolean; key: number }[] }[] = [];
  let current: { ch: string; locked: boolean; key: number }[] = [];
  let key = 0;
  for (const seg of segments) {
    if (seg.br) {
      lineBlocks.push({ chars: current });
      current = [];
      continue;
    }
    current.push({ ch: seg.ch, locked: seg.locked, key: key++ });
  }
  lineBlocks.push({ chars: current });

  return (
    <span
      className={className}
      aria-label={fullLabel}
      onPointerEnter={() => {
        if (reduceMotion === true) return;
        startScramble();
      }}
      onPointerLeave={stopScramble}
    >
      {lineBlocks.map((block, li) => (
        <span key={li} className="block">
          {block.chars.map(({ ch, locked, key: k }) => (
            <span key={k} className={cx(!locked && hovering && scrambledClassName)}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
