/**
 * Cloudflare Worker to rewrite /deleteAccount to /deleteAccount/
 * This eliminates the 301 redirect from GitHub Pages
 * 
 * To deploy:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create application → Create Worker
 * 2. Paste this code
 * 3. Add route: admin.moments.live/deleteAccount
 * 4. Deploy
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Rewrite /deleteAccount to /deleteAccount/ to avoid 301 redirect
  if (url.pathname === '/deleteAccount') {
    url.pathname = '/deleteAccount/'
    // Create a new request with the rewritten URL
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



