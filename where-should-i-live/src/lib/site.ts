/**
 * GitHub Pages project sites live under /repo-name; set NEXT_PUBLIC_BASE_PATH to match.
 * Leave empty for user/organization root sites or a custom domain at the apex.
 */
export const basePath =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "")) ||
  "";

export function withBasePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) return p;
  return `${basePath}${p}`;
}

/** Host your Next API elsewhere (Railway, Fly, Cloudflare Workers, etc.) for static deploys. */
export function apiUrl(path: string): string {
  const root = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return root ? `${root}${p}` : p;
}
