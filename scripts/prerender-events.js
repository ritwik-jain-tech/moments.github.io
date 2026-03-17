// scripts/prerender-events.js  (variant: event-only)
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { API_BASE_URL } = require('../config/api');

const DIST_ROOT = path.join(__dirname, '..', 'dist');
const DIST_EVENT_DIR = path.join(DIST_ROOT, 'event');
const API_LIST = `${API_BASE_URL}/api/event`;
const SITE_ORIGIN = 'https://admin.moments.live';
const FALLBACK_IMAGE = '/default-event.jpg';

function escapeHtml(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir,{ recursive:true }); }
function normalizeImageUrl(img){ if(!img) return `${SITE_ORIGIN}${FALLBACK_IMAGE}`; if(/^https?:\/\//i.test(img)) return img; if(img.startsWith('/')) return `${SITE_ORIGIN}${img}`; return `${SITE_ORIGIN}/${img}`; }

function renderHtml({ id, title, description, image, url }) {
  const escTitle = escapeHtml(title);
  const escDesc = escapeHtml(description);
  const escImage = escapeHtml(image);
  const escUrl = escapeHtml(url);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escTitle}</title>
<meta property="og:type" content="website"/><meta property="og:title" content="${escTitle}"/><meta property="og:description" content="${escDesc}"/><meta property="og:url" content="${escUrl}"/><meta property="og:image" content="${escImage}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escTitle}"/><meta name="twitter:description" content="${escDesc}"/><meta name="twitter:image" content="${escImage}"/>
<link rel="canonical" href="${escUrl}"/></head><body><script>try{window.location.replace('/event/${id}');}catch(e){}</script><noscript><a href="/event/${id}">Open event</a></noscript></body></html>`;
}

(async function main(){
  try{
    console.log('Prerender (events-only): fetching', API_LIST);
    const res = await axios.get(API_LIST, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
    const events = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    if (!events.length) { console.warn('No events returned.'); process.exit(0); }
    ensureDir(DIST_EVENT_DIR);
    for (const ev of events) {
      const id = ev.id || ev.eventId || ev._id || ev.eventID || ev._uid || ev.uid;
      if (!id) { console.warn('Skipping event w/o id', ev); continue; }
      const eventName = ev.eventName || 'Moments Event';
      const title = `${eventName} | Moments`;
      const description = `Join the ${eventName} photo stream — upload and view real-time photos from our guests.`;
      const image = normalizeImageUrl(ev.eventThumbnail || ev.coverImage || ev.image);
      const url = `${SITE_ORIGIN}/event/${id}`;
      const html = renderHtml({ id, title, description, image, url });

      const eventDir = path.join(DIST_EVENT_DIR, String(id));
      ensureDir(eventDir);
      const eventOutPath = path.join(eventDir, 'index.html');
      fs.writeFileSync(eventOutPath, html, 'utf8');
      console.log('Wrote', eventOutPath);
    }
    console.log('Prerender complete (events-only).');
    process.exit(0);
  } catch (err) {
    console.error('Prerender error:', err && err.message || err);
    process.exit(1);
  }
})();
