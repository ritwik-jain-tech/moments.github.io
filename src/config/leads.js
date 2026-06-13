// Google Apps Script Web App URL that appends "Free Trial" form submissions
// to a Google Sheet (downloadable as Excel). Paste your deployment URL below.
//
// Setup (one-time, ~3 min):
//   1. Create a Google Sheet (this is your "Excel" of leads).
//   2. Extensions → Apps Script, paste the doPost() snippet shared with this
//      change, Save.
//   3. Deploy → New deployment → type "Web app" → Execute as: Me →
//      Who has access: Anyone → Deploy → copy the Web app URL.
//   4. Paste that URL here and redeploy the site.
//
// Until set, the form still works for visitors but submissions are only logged
// to the browser console.
export const LEADS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxHsatRfr-96Mq7w2nSnr-L-XiNzvntgAs0ASd8yPolJsvI9PemIKyJBDA4R6pPxIrkHQ/exec';
