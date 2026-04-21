# SpaceX Air · booking flow

Multi-step airline booking funnel: search → flights → interactive seat map → traveler details → review → payment → confirmation with boarding passes.

- **Stack:** Next.js App Router, React context, Tailwind CSS v4, session persistence via `sessionStorage`.

## Run locally

```bash
cd booking-flow
npm install
npm run dev
```

Open `/` (redirects to `/search`).

## Deploy

Deploy on [Vercel](https://vercel.com): import this folder as the app root, or run `npx vercel`.

Set **Root Directory** to `booking-flow` when importing from the `ai-side-projects` monorepo.
