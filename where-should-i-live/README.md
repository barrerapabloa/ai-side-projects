# Where should you live next?

Minimal quiz → three city picks with grounded context (Wikipedia, Open‑Meteo).

## Deploy on Vercel (same as local `npm run dev`)

1. Import the repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to **`where-should-i-live`** (this repo is a monorepo).
3. Leave **Build Command** as `npm run build` and **Output** as Next.js default (not static export).
4. Deploy.

Do **not** set `STATIC_EXPORT` on Vercel. Do **not** set `NEXT_PUBLIC_BASE_PATH` unless you intentionally serve under a subpath.

The app uses Next.js **Route Handlers** under `src/app/api/*` (`/api/recommend`, `/api/search`, `/api/og`), so the quiz and share image work on the same origin—just like running `npm run dev` locally.

Optional env vars live in **Vercel → Project → Settings → Environment Variables** if you extend search (e.g. `SEARCH_PROVIDER`, Tavily keys, etc.).

## Local development

**Recommended (matches Vercel):**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/api/*` is served by Next.

**Optional — standalone API process** (same handlers as `server/http.ts`, useful if you want to test that entrypoint):

```bash
npm run dev:api    # API on :3001
npm run dev:full   # Next on :3000 + API on :3001 (dev rewrites when API_DEV_PORT is set)
```

Put secrets in **`.env.local`** at the project root. `server/http.ts` loads them for `dev:api` / `dev:full`. For `npm run dev` only, Next loads `.env.local` automatically.

## GitHub Pages (static export)

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Workflow: [`.github/workflows/where-should-i-live-pages.yml`](../.github/workflows/where-should-i-live-pages.yml) runs `STATIC_EXPORT=1`, removes `src/app/api` for that build, and uploads `out/`.

**Project site** (`https://USER.github.io/REPO/`): set variable **`NEXT_PUBLIC_BASE_PATH`** = **`/REPO`**.

Static Pages cannot run APIs; use **`NEXT_PUBLIC_API_BASE_URL`** pointing at a host running `server/http.ts`, or deploy on Vercel instead.

**Local static build:** `npm run build:pages` (stashes API, exports to `out/`).

## Scripts

| Script        | Purpose                                      |
| ------------- | -------------------------------------------- |
| `dev`         | Next dev (API included) — same idea as Vercel |
| `dev:api`     | Standalone API on port 3001                  |
| `dev:full`    | Next + standalone API + dev rewrites         |
| `build`       | Production build for Vercel / `next start`   |
| `build:pages` | Static `out/` for GitHub Pages               |
