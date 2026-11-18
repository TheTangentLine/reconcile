# vercel-frontend

The Reconcile frontend as a **fully static site**: no backend, no database.
Method and formula data is bundled into the JavaScript, so it can be hosted
anywhere that serves static files. It's set up for [Vercel](https://vercel.com).

**Live:** https://reconcile-rubik.vercel.app

It started as a copy of [`apps/frontend`](../frontend) and adds a few things
of its own:

- **Play mode** (`/play`): a free 3D cube with a timer and a formula sheet.
- **Full OLL (57) and PLL (21)** in the CFOP data, on top of the 2-look sets.
- **Bundled data** instead of the backend API.

| | `apps/frontend` | `apps/vercel-frontend` |
|---|---|---|
| Data comes from | the backend API (`/api/...`) → MongoDB | `src/data/methods.ts`, bundled |
| `src/api/useApi.ts` | fetches and caches | returns the bundled data immediately |
| Needs | backend + database | nothing |
| Hosted on | Docker / Kubernetes (nginx) | Vercel (or any static host) |
| Editing formulas | change the database | edit `src/data/methods.ts`, push |
| Play mode, full OLL/PLL | no | yes |

Both apps expose the same `useMethods()` / `useMethod(slug)` hooks, so the
shared pages and components (home, method page, guide, formula list) still
match. The files that differ are the data layer, `src/pages/PlayPage.tsx`,
`src/play/`, `src/cube/drag.ts`, and drag-to-turn support in
`src/cube/CubeView.tsx`.

> [!NOTE]
> `src/data/methods.ts` started as a copy of the backend seed
> (`apps/backend/src/seed/methods.ts`). The two don't sync automatically; if
> you change formulas in one, copy them to the other.

## Play mode

Open **`/play`** (or *Play* in the top bar).

| Control | How |
|---|---|
| **Mouse / finger** | Drag a sticker to turn its layer. Drag the background to look around. |
| **Keyboard** | `R L U D F B` turn that face clockwise, `Shift` + letter counter-clockwise, `M E S` slices, `X Y Z` or arrow keys turn the whole cube |
| **Buttons** | The move pad under the cube (handy on phones) |
| **Space** | New scramble; the timer starts on your first turn and stops when the cube is solved |
| **⌫ / Ctrl+Z**, **Esc** | Undo, reset |

The **formula sheet** next to the cube lists every formula by method and
stage, with search. **Practice** sets up that formula's case (timed);
**Show me** sets it up and plays the formula. Times, best, ao5 and ao12 are
saved in your browser (localStorage) only.

## Run locally

```bash
cd apps/vercel-frontend
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # cube logic, drag-to-turn, timer, and checks on every bundled formula
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
