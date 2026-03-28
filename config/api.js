// Node scripts (e.g. scripts/prerender-events.js). Defaults match production.
const PROD_API_BASE_URL = 'https://momentsbackend-673332237675.us-central1.run.app';

const API_BASE_URL =
  process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || PROD_API_BASE_URL;

module.exports = {
  API_BASE_URL,
};
