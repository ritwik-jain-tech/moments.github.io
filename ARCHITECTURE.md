# Architecture — moments.github.io

> Auto-derived from codebase knowledge graph (codebase-memory-mcp). 2497 nodes / 10238 edges.
> Query the live graph for detail: `search_graph`, `trace_path`, `get_architecture`.

## Stack
- **JavaScript** (73 files) + React, **Vite** build. HTML/CSS, small TypeScript surface (`pages/_app.tsx`, `index.tsx`).
- Deploy: Netlify (`netlify.toml`) + Vercel (`vercel.json`) + Cloudflare Worker (`cloudflare-worker.js`). GitHub Actions (`.github/workflows/deploy.yml`).
- Firebase (`src/firebase/config.js`) — auth / OTP.

## Layout
- `src/App.jsx`, `src/main.jsx`, `src/router.jsx` — app entry + routing.
- `src/pages/` — route screens. Public: `Landing`, `B2BLanding`, `PublicEvent`, `EventDetails`, `PrivacyPolicy`, `DeleteAccount`. Admin: `AdminEvents`, `AdminStorage`, `AdminTeam`, `AdminSettings`, `AdminUploads`, `AdminLogin`, `AdminSignup`.
- `src/components/` — 24 UI components (`Navbar`, `MomentUploader`, `UploadWidget`, `LiquidButton`, landing sections). `src/components/ui/button.jsx` shadcn-style.
- `src/context/` — `ThemeContext` (`useTheme`), `UploadContext` (`useUpload`).
- `src/lib/uploadEngine.js` — core upload: batching (`buildSizeAwareBatches`), retry/backoff (`isRetryableError`, `backoffDelay`), image dims (`getImageDimensions`, `calculateAspectRatio`).
- `src/hooks/useMetaTags.js`, `src/lib/motion.js` (framer-motion presets).
- `src/config/api.js` + `config/api.js` — backend endpoints. `src/config/leads.js`.
- `src/utils/` — `adminSession`, `fetchUserEvents`, `imageCrop`.
- `admin-dashboard/` — **separate** legacy Create-React-App admin (own `src/api`, `components`). Distinct from `src/pages/Admin*`.
- `scripts/prerender-events.js` — static prerender for SEO.

## Entry points
`MomentsLiveLanding` (index.tsx) · `App` (src/App.jsx) · `main` (scripts/prerender-events.js).

## Clusters (graph communities)
- Landing/marketing UI (cohesion 0.95): `Landing`, `B2BLanding`, `Navbar`, `LiquidButton`, `BrowserFrame`.
- Admin pages: `AdminEvents`, `AdminTeam`, `AdminStorage`, `AdminSettings`.
- Event view: `EventDetails`, `fetchMoments`, `PublicEvent`, `isVideoMoment`, `renderMediaTab`.
- Upload: `MomentUploader`, `UploadProvider`, `handleFiles`.

## Notes
- `assets/index-*.js` + `assets/index-*.css` are **built bundle artifacts** (checked into repo). Graph hotspots with single-letter names (`push`, `L`, `X`, `pC`) come from this minified bundle — ignore for source analysis; real code lives in `src/`.
- No real HTTP routes server-side; `routes` in graph are regex artifacts. Backend is `momentsBackend` (separate repo).
