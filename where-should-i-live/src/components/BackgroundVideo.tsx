"use client";

import { withBasePath } from "@/lib/site";

export function BackgroundVideo() {
  return (
    <div className="bgVideo" aria-hidden="true">
      <video
        src={withBasePath("/bg-v4.mp4")}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}

