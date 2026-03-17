# Cloudflare Configuration to Eliminate 301 Redirect for /deleteAccount

## Issue
GitHub Pages automatically redirects `/deleteAccount` to `/deleteAccount/` (301 redirect) when a directory exists. This causes `curl -I https://admin.moments.live/deleteAccount` to return 301 instead of 200.

## Solution Options

### Option 1: Cloudflare Workers (Works on Free Plan - Recommended)

This is the most reliable solution and works on all Cloudflare plans including free.

#### Steps:

1. **Go to Cloudflare Dashboard**
   - Select your domain: `admin.moments.live`
   - Navigate to: **Workers & Pages** (in left sidebar)

2. **Create a Worker:**
   - Click **Create application** → **Create Worker**
   - Or click **Create** → **Worker**

3. **Configure the Worker:**
   - **Name**: `deleteAccount-rewrite` (or any name)
   - **HTTP handler**: Leave default
   - Paste the code from `cloudflare-worker.js` (see below)

4. **Deploy the Worker:**
   - Click **Deploy**

5. **Add Route:**
   - Go to **Workers & Pages** → Your worker → **Settings** → **Triggers**
   - Click **Add route**
   - **Route**: `admin.moments.live/deleteAccount`
   - **Zone**: Select `admin.moments.live`
   - Click **Add route**

#### Worker Code (from `cloudflare-worker.js`):

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Rewrite /deleteAccount to /deleteAccount/ to avoid 301 redirect
  if (url.pathname === '/deleteAccount') {
    url.pathname = '/deleteAccount/'
    const rewrittenRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    })
    return fetch(rewrittenRequest)
  }
  
  // Pass through all other requests
  return fetch(request)
}
```

---

### Option 2: Cloudflare Transform Rules (If Available)

**Note:** Transform Rules may require a paid plan. If you don't see this option, use Option 1 (Workers) instead.

1. **Go to Cloudflare Dashboard**
   - Navigate to: **Rules** → **Transform Rules** → **URL Rewrite**
   - (If you don't see "Transform Rules", use Option 1 instead)

2. **Create a new URL Rewrite rule:**
   - Click **Create rule**
   - **Rule name**: `deleteAccount-rewrite`
   
3. **Configure the rule:**
   - **When incoming requests match:**
     ```
     (http.host eq "admin.moments.live" and http.request.uri.path eq "/deleteAccount")
     ```
   
   - **Then rewrite to:**
     - Select **Dynamic**
     - Enter: `concat("/deleteAccount/", http.request.uri.query)`
   
   - **Status**: Enabled

4. **Save the rule**

---

### Option 3: Page Rules (Legacy - May Not Work for Rewrites)

**Note:** Page Rules can redirect but not rewrite. This will still show a redirect, but you can try it:

1. Go to **Rules** → **Page Rules**
2. Create rule: `admin.moments.live/deleteAccount*`
3. Setting: **Forwarding URL** → **301 Permanent Redirect** → `https://admin.moments.live/deleteAccount/`
4. **Note:** This still causes a redirect, so it won't solve the 200 status issue

### Result:
- `/deleteAccount` → Cloudflare rewrites to `/deleteAccount/` → GitHub Pages serves 200 ✅
- No redirect visible to clients
- `curl -I https://admin.moments.live/deleteAccount` will return **200 OK**

---

## Alternative: Cloudflare Worker

If Transform Rules don't work, use a Cloudflare Worker (see `cloudflare-worker.js` in this repo).

### Steps:

1. Go to **Workers & Pages** → **Create application** → **Create Worker**
2. Copy the code from `cloudflare-worker.js`
3. Add route: `admin.moments.live/deleteAccount`
4. Deploy

---

## Testing

After configuration, test with:
```bash
curl -I https://admin.moments.live/deleteAccount
```

Expected result:
```
HTTP/2 200
```

Instead of:
```
HTTP/2 301
```

---

## Current Behavior (Without Cloudflare Config)

- `/deleteAccount` → 301 redirect → `/deleteAccount/` → 200 (page works, but shows 301)
- The page functions correctly, but returns 301 status which may affect:
  - SEO (search engines)
  - API crawlers (like Google's app review)
  - Direct HTTP status checks

