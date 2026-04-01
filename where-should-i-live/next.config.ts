import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";
/** Set to `1` only for GitHub Pages (static `out/`). Omit on Vercel and local `next dev`. */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  basePath: basePath || undefined,
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

if (process.env.NODE_ENV !== "production") {
  nextConfig.rewrites = async () => {
    const port = process.env.API_DEV_PORT;
    if (port) {
      return [
        {
          source: "/api/:path*",
          destination: `http://127.0.0.1:${port}/api/:path*`,
        },
      ];
    }
    return [];
  };
}

export default nextConfig;
