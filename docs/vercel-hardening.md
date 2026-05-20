# Vercel Hardening Audit

## Main risks found

- `/` was forcing dynamic rendering via `dynamic = "force-dynamic"`.
- `loadRegistry()` used `cache: "no-store"`, so registry-backed HTML always bypassed CDN/ISR.
- `/item/[id]` fetched the full registry client-side on every visit instead of serving a cacheable HTML response.
- `MarketplaceClient` re-fetched the registry again on mount even after SSR had already loaded the same data.
- Remote NFT/media images were rendered through `next/image` with fully open `remotePatterns`, which can turn Vercel image optimization into a high-bandwidth proxy for arbitrary origins.
- No fast denylist existed for common scanner paths like `/wp-admin`, `/.env`, or `*.php`.
- No `robots.txt` or `sitemap.xml` existed to guide crawlers toward cheap public pages and away from utility paths.

## Changes applied

- Registry-backed pages now use ISR with `revalidate = 3600`.
- `loadRegistry()` now uses `next.revalidate` instead of `no-store`.
- `/item/[id]` now resolves server-side and returns `404` through Next when the listing does not exist.
- Remote images now bypass Vercel optimization and load directly in the browser.
- Public HTML now returns:
  - `Vercel-CDN-Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
  - `CDN-Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
  - `Cache-Control: public, max-age=0, must-revalidate`
- Public repo assets such as `/placeholders/*` now return:
  - `Vercel-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
  - `CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
  - `Cache-Control: public, max-age=86400`
- Hashed Next assets under `/_next/static/*` now return:
  - `Vercel-CDN-Cache-Control: public, max-age=31536000, immutable`
  - `CDN-Cache-Control: public, max-age=31536000, immutable`
  - `Cache-Control: public, max-age=31536000, immutable`
- Middleware now returns a fast cached `404` for:
  - `/wp-admin`
  - `/xmlrpc.php`
  - `/.env`
  - `/.env.*`
  - `/admin`
  - `/login`
  - `/cgi-bin*`
  - `*.php`
- `robots.txt` now blocks crawler access to utility/scanner paths and exposes `sitemap.xml`.
- `sitemap.xml` now includes the home page, support pages, and registry-backed item pages.

## Verification

Run these checks after deployment:

```bash
curl -I https://marketplace.xolosarmy.xyz/
curl -I "https://marketplace.xolosarmy.xyz/?collection=User%20Listings"
curl -I https://marketplace.xolosarmy.xyz/item/REPLACE_WITH_REAL_ID
curl -I https://marketplace.xolosarmy.xyz/placeholders/nft-1.svg
curl -I https://marketplace.xolosarmy.xyz/wp-admin
curl -I https://marketplace.xolosarmy.xyz/robots.txt
curl -I https://marketplace.xolosarmy.xyz/sitemap.xml
```

Expected results:

- Public HTML routes should expose the three cache headers with `s-maxage=3600` and `stale-while-revalidate=86400`.
- `/placeholders/nft-1.svg` should expose the three asset cache headers with one day browser cache and one week CDN stale allowance.
- `/_next/static/*` assets should expose `immutable`.
- `/wp-admin` should return `404` quickly with `X-Robots-Tag: noindex, nofollow`.
- `robots.txt` and `sitemap.xml` should be publicly readable and CDN-cacheable.

## Pending before reconnecting `marketplace.xolosarmy.xyz`

- In Vercel dashboard, verify that no route is configured with `no-store` overrides or disabled caching.
- In Vercel dashboard, add Firewall rules if available on the plan to challenge or block obvious bot patterns and abusive countries/ASNs:
  - block or challenge requests to `/wp-admin`, `/xmlrpc.php`, `/.env`, `/cgi-bin*`, and `*.php`
  - rate-limit high-frequency hits to `/`, `/item/*`, and any future `/api/*`
- Confirm the upstream registry at `api.xolosarmy.xyz` also sends cache headers if it is hit directly by browsers.
- If listing images are large, add a thumbnail field to the registry payload and render thumbnails in cards while keeping the original only on detail view.
- Monitor Vercel Observability or access logs for `_next/image`, `/wp-admin`, and repeated user agents immediately after reconnecting the domain.
