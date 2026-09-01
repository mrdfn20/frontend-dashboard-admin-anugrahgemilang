# CV Anugrah Gemilang - Admin Dashboard

SvelteKit admin dashboard for CV Anugrah Gemilang's water-gallon delivery business — customer management, transactions & debt collection, gallon stock, fleet, reports, and user administration. Consumes the [companion Express/MySQL backend](../cv-anugrah-backend).

## Features

- 🔐 Login with JWT (access + refresh token, auto-refresh on expiry)
- 👥 **Pelanggan** — customer CRUD, Google-Drive-hosted photo, search
- 💰 **Transaksi** — create Tunai/Hutang transactions via type-ahead customer picker (no more dropdown), live "estimated total" and Tunai/Hutang guidance as you type the paid amount, restore soft-deleted transactions, pay off debts inline
- 🚰 **Galon** — current unreturned-gallon stock per customer, plus a global movement history tab with running balance
- 🧾 **Hutang** — cross-customer debt list with status/date/name filters, pay directly from the list
- 🚚 **Kelola Armada** — fleet CRUD (Admin only)
- 📊 **Dashboard** & **Laporan** — summary cards + custom date-range report with CSV export
- 👤 **User Management** & **Audit Log** (Admin only)
- 🔍 Global search overlay (`Ctrl+K`)
- Currency inputs with thousand-separator formatting and select-on-focus; infinite-scroll lists (server-side paginated for Transaksi/Audit Log/Hutang, the datasets that grow without bound)

## Technology Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes-free / legacy `export let` style, matching the existing codebase convention)
- **Styling**: Tailwind CSS (maroon brand theme)
- **State**: Svelte stores (`src/lib/stores/*.js`) + a thin `api.js` fetch wrapper that unwraps the backend's `{ success, data }` envelope
- **Notifications**: svelte-french-toast
- **Package manager**: pnpm
- **Deploy adapter**: `@sveltejs/adapter-node` (self-hosted VPS, not Vercel/Netlify)

## Prerequisites

- Node.js v20+
- pnpm
- The [backend](../cv-anugrah-backend) running and reachable

## Local Setup

```bash
git clone git@github.com:mrdfn20/frontend-dashboard-admin-anugrahgemilang.git
cd frontend-dashboard-admin-anugrahgemilang
pnpm install
cp .env.example .env   # set VITE_API_URL to your backend, e.g. http://localhost:5000/api
pnpm run dev
```

## Scripts

```bash
pnpm run dev       # dev server (localhost:5173)
pnpm run build     # production build (build/) via adapter-node
pnpm run preview   # preview the production build locally
pnpm run lint      # prettier --check + eslint
pnpm run format    # prettier --write
```

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte, +page.svelte          # login page
│   └── dashboard/
│       ├── +layout.svelte                     # sidebar shell, role-gated nav
│       ├── customers/, transactions/, gallon/, payments/,
│       │   armada/, reports/, users/, audit-logs/
│       └── customers/[id]/                     # customer detail
├── lib/
│   ├── actions/       # Svelte actions: infiniteScroll, selectOnFocus
│   ├── components/     # grouped by feature (transactions/, customers/, ui/, ...)
│   ├── services/       # api.js (fetch wrapper), customers.js
│   ├── stores/         # 1 store module per feature, writable + actions object pattern
│   └── utils/          # csv.js (client-side CSV export)
```

**Store pattern**: each `src/lib/stores/*.js` exports plain `writable`/`derived` stores plus an `xxxActions` object of async functions that call `api.js` and update the stores (with toast feedback on success/error). Pages import stores + the actions object; components stay presentational and communicate up via `dispatch`.

**Server-side pagination**: `transactions.js`, `auditLogs.js`, and `payments.js` stores hold *accumulated pages* (not the full dataset) with a `loadPage({ reset })` action — `reset: true` on filter/search change, `reset: false` from the `infiniteScroll` action's `onLoadMore` as the user scrolls. Other lists (Pelanggan, Galon, Armada) still load everything up front and paginate client-side — their size is bounded by customer count, which grows slowly enough not to need it.

## Building & Deployment

Production build uses `@sveltejs/adapter-node`, producing a standalone Node server in `build/`. `VITE_API_URL` is baked in at **build time** (Vite env vars aren't runtime-configurable) — production/staging both build with `VITE_API_URL=/api` (relative), since nginx serves the frontend and proxies `/api/*` to the backend on the same origin, so there's never a cross-origin request.

Deployed alongside the backend on one VPS, managed by PM2, behind nginx:

| | Production | Staging |
|---|---|---|
| Branch | `main` | `develop` |
| Port (internal) | 3000 | 3001 |
| Public URL | `:80` via nginx | `:8080` via nginx |
| PM2 process | `cv-anugrah-frontend` | `cv-anugrah-frontend-staging` |

### CI/CD

`.github/workflows/deploy-production.yml` / `deploy-staging.yml`: on push to `main`/`develop`, GitHub Actions installs deps, runs `pnpm run lint`, builds (`vite build`), uploads the `build/` output + `package.json`/lockfiles to the VPS via `appleboy/scp-action`, then SSHes in to `pnpm install --prod` (runtime deps only — this deliberately skips `vite`/`esbuild`, which are dev-only and would otherwise hit pnpm's interactive build-script-approval prompt in a non-interactive shell) and `pm2 restart`.

> **Push `main` and `develop` as two separate commands** (`git push origin main` then `git push origin develop`), not combined in one `git push` — a combined multi-branch push has been observed to only trigger the GitHub Actions workflow for one of the two refs.

### Manual server operations (if ever needed)

```bash
ssh <user>@<vps-host>
cd ~/apps/frontend            # or frontend-staging
git pull origin main          # or develop
echo "VITE_API_URL=/api" > .env.production.local && pnpm run build
pnpm install --prod
pm2 restart cv-anugrah-frontend    # or cv-anugrah-frontend-staging
pm2 logs cv-anugrah-frontend       # tail logs
```

## Known conventions

- Modal backdrop across the app: `fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300` (frosted glass, not a solid dark overlay).
- Money inputs use the shared `CurrencyInput` component (`src/lib/components/ui/CurrencyInput.svelte`); plain numeric inputs use the `selectOnFocus` action so a click lets you type over the value immediately instead of having to delete it first.
