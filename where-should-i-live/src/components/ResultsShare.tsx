"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { apiUrl, withBasePath } from "@/lib/site";

export function ResultsShare({
  dataParam,
}: {
  dataParam: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!dataParam) return null;
    const url = new URL(window.location.href);
    url.pathname = withBasePath("/results");
    url.search = `?data=${encodeURIComponent(dataParam)}`;
    return url.toString();
  }, [dataParam]);

  const ogUrl = useMemo(() => {
    if (!dataParam) return null;
    const apiRoot = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (apiRoot) {
      return `${apiUrl("/api/og")}?data=${encodeURIComponent(dataParam)}`;
    }
    const url = new URL(window.location.href);
    url.pathname = withBasePath("/api/og");
    url.search = `?data=${encodeURIComponent(dataParam)}`;
    return url.toString();
  }, [dataParam]);

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-muted">
        Share a link, or open the image for screenshots.
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copy}
          disabled={!shareUrl}
          className="h-10 rounded-none border border-line bg-white px-4 text-[13px] font-medium tracking-wide text-ink/85 transition hover:border-black/40 disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={ogUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className={!ogUrl ? "pointer-events-none opacity-50" : ""}
        >
          <Button className="w-full sm:w-auto">Open share image</Button>
        </a>
      </div>
    </div>
  );
}

