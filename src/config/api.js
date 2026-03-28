/**
 * API base URLs. Production fallbacks match deployed Cloud Run services.
 *
 * Local: `npm run dev` loads `.env.development` (Vite). Override with `.env.local` (gitignored).
 * Production build: use `.env.production` or rely on the fallbacks below (e.g. GitHub Pages CI).
 */

const PROD_API_BASE_URL = 'https://momentsbackend-673332237675.us-central1.run.app';
const PROD_FACE_TAGGING_BASE_URL = 'https://momentsfacetagging-673332237675.asia-south2.run.app';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;

/** Base URL for face-tagging HTTP API (rotate, etc.) — no trailing slash */
export const FACE_TAGGING_BASE_URL =
  import.meta.env.VITE_FACE_TAGGING_BASE_URL || PROD_FACE_TAGGING_BASE_URL;
