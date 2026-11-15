# vercel-frontend

The Reconcile frontend as a **fully static site**: no backend, no database.
Method and formula data is bundled into the JavaScript, so it can be hosted
anywhere that serves static files. It's set up for [Vercel](https://vercel.com).

It's a copy of [`apps/frontend`](../frontend) with one difference: the data
layer.

| | `apps/frontend` | `apps/vercel-frontend` |
|---|---|---|
| Data comes from | the backend API (`/api/...`) → MongoDB | `src/data/methods.ts`, bundled |
| `src/api/useApi.ts` | fetches and caches | returns the bundled data immediately |
| Needs | backend + database | nothing |
| Hosted on | Docker / Kubernetes (nginx) | Vercel (or any static host) |
| Editing formulas | change the database | edit `src/data/methods.ts`, push |

Both apps expose the same `useMethods()` / `useMethod(slug)` hooks, so every
page and component file is identical. A change to a component can be copied
across as-is.

> [!NOTE]
> `src/data/methods.ts` started as a copy of the backend seed
> (`apps/backend/src/seed/methods.ts`). The two don't sync automatically; if
> you change formulas in one, copy them to the other.

## Run locally

```bash
cd apps/vercel-frontend
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # cube logic + checks that every bundled formula solves its case
npm run lint
npm run build      # static files in dist/
npm run preview    # serve dist/ like production
```

## Deploy to Vercel

### Option A: connect the GitHub repo (recommended)

1. On [vercel.com](https://vercel.com): **Add New… → Project → Import** the
   `reconcile` repository.
2. Under **Root Directory**, click **Edit** and choose `apps/vercel-frontend`.
3. Leave the build settings alone; `vercel.json` provides them. Click **Deploy**.

From then on:

- every push to `main` deploys to production;
- every pull request gets its own **preview URL**;
- pushes that don't touch this folder since the last deployment (backend
  changes, the CI bot's chart updates, docs) are **skipped**, thanks to
  `ignoreCommand` in `vercel.json`.

### Option B: from your terminal

```bash
cd apps/vercel-frontend
npx vercel          # first run: log in and link the project; creates a preview deployment
npx vercel --prod   # deploy to production
```

> [!TIP]
> The CLI stores the project link in `.vercel/`, which is git-ignored.

## What `vercel.json` does

| Setting | Why |
|---|---|
| `framework`, `buildCommand`, `outputDirectory` | Build with Vite into `dist/` |
| `installCommand: npm ci` | Install exactly what `package-lock.json` says |
| `ignoreCommand` | Skip the build when nothing in this folder changed **since the last successful deployment** (always builds the first time) |
| `rewrites` → `/index.html` | Client-side routes like `/method/cfop` work on refresh and direct links |
| `headers` on `/assets/*` | Hashed JS/CSS files are cached for a year |
