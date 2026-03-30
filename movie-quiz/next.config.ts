import type { NextConfig } from "next";

// GitHub Pages project URL: https://<user>.github.io/<repo>/
const repoSlug = "ai-side-projects";
const pagesSubpath = "radar-reel";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? `/${repoSlug}/${pagesSubpath}` : "",
  assetPrefix: isGitHubPages ? `/${repoSlug}/${pagesSubpath}/` : "",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
