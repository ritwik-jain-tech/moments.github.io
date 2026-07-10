# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Vision

**studio.moments.live** is being built as a professional tool for photographers and media agencies to manage and store media with AI-driven workflows. This is a B2B product aimed at creative professionals — distinct from the consumer-facing Moments.live wedding app. The current repo is an early static site that will evolve into a full web application.

**Target users:** Photographers, videographers, media agencies  
**Core value props:** AI-assisted media management, professional storage, workflow automation  
**Hosted at:** `studio.moments.live` via GitHub Pages (custom domain in `CNAME`)

## Commands

No build step currently — plain HTML/CSS/JS. To preview locally:

```bash
python3 -m http.server 8000
```

Deployment is automatic via GitHub Pages on push to `main`. The custom domain is set in the `CNAME` file.

## Current State

The site is a minimal static placeholder. Existing files:
- `index.html` — single-page site with anchor nav (Features, How It Works, Download, Contact)
- `privacy-policy.html` — accordion-based privacy policy page
- `styles.css` — dark theme (`#1b1b1b` background, `#c49bff` purple accent), shared across both pages
- `script.js` — accordion toggle for `privacy-policy.html` (has a syntax bug — `forEach` missing closing `)`)
- `CNAME` — contains `studio.moments.live`

**Known broken things to fix before building on top of this:**
- `wedding-hero.jpg` referenced in CSS background does not exist in the repo
- App Store / Google Play links are `#` placeholders
- `script.js` has a `forEach` syntax error

## Hosting & Scaling

**Current: GitHub Pages**
- Free, zero-ops, auto-deploys from `main`
- Limits: 1 GB repo size, 100 GB/month bandwidth, no server-side logic, no auth, no dynamic APIs
- Fine for a static marketing/landing page; will hit a wall the moment the product needs login, file uploads, AI API calls, or any backend

**If GitHub Pages becomes a bottleneck, best free alternatives:**

| Platform | Why it fits |
|----------|------------|
| **Cloudflare Pages** | Unlimited bandwidth on free tier, global CDN, supports Workers (serverless functions) for lightweight API routes — best first upgrade from GitHub Pages |
| **Vercel** | Excellent for Next.js/React frontends; free tier includes serverless functions, 100 GB bandwidth — ideal if the UI grows into a React/Next app |
| **Netlify** | Similar to Vercel; 100 GB bandwidth, Functions support, form handling built in |
| **Render** (static sites) | Free static hosting with no bandwidth cap listed; supports background workers if needed alongside |

**Recommended migration path:** Move to **Cloudflare Pages** first — it requires no framework change, supports the same push-to-deploy workflow, adds unlimited bandwidth, and Cloudflare Workers can handle AI proxy calls or auth without needing a dedicated backend immediately.
