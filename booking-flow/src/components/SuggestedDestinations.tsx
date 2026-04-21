"use client";

import Image from "next/image";
import { useState } from "react";
import type { SuggestedDestination } from "@/data/suggestedDestinations";

type SuggestedDestinationsProps = {
  items: SuggestedDestination[];
  onPick: (destinationCode: string) => void;
};

export function SuggestedDestinations({
  items,
  onPick,
}: SuggestedDestinationsProps) {
  const [hearts, setHearts] = useState<Record<string, boolean>>({});

  function toggleHeart(code: string, e?: React.SyntheticEvent) {
    e?.stopPropagation();
    setHearts((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  return (
    <section aria-label="Suggested destinations" className="w-full">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Inspiration for your next trip
        </h2>
        <span className="text-zinc-400" aria-hidden>
          →
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((d) => (
          <div key={d.code} className="min-w-0">
            <div
              tabIndex={0}
              onClick={() => onPick(d.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(d.code);
                }
              }}
              className="group/card w-full cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-800 shadow-sm ring-1 ring-white/[0.08] transition group-hover/card:shadow-lg group-hover/card:ring-white/15">
                <Image
                  src={d.imageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 22vw"
                  className="object-cover transition duration-500 group-hover/card:scale-[1.03]"
                />
                {d.tag ? (
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm ring-1 ring-black/5">
                    {d.tag}
                  </span>
                ) : null}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={hearts[d.code] ? "Remove from saved" : "Save"}
                  onClick={(e) => toggleHeart(d.code, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleHeart(d.code, e);
                    }
                  }}
                  className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:scale-105"
                >
                  <svg
                    className={`size-4 ${hearts[d.code] ? "fill-rose-500 text-rose-500" : "fill-none"}`}
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-3 font-semibold text-white">{d.city}</p>
              <p className="mt-0.5 text-[14px] text-zinc-400">{d.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
