"use client";

export function BackgroundVideo() {
  return (
    <div className="bgVideo" aria-hidden="true">
      <video
        src="/bg-v4.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}

