import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PAGE_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const PUBLIC_BROWSER_CACHE = "public, max-age=0, must-revalidate";
const PUBLIC_ASSET_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";
const PUBLIC_ASSET_BROWSER_CACHE = "public, max-age=86400";

const BLOCKED_EXACT_PATHS = new Set([
  "/wp-admin",
  "/xmlrpc.php",
  "/.env",
  "/admin",
  "/login"
]);

function isBlockedScannerPath(pathname: string) {
  if (BLOCKED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return (
    pathname.startsWith("/cgi-bin") ||
    pathname.startsWith("/.env.") ||
    pathname.endsWith(".php")
  );
}

function isStaticPublicAsset(pathname: string) {
  return /^\/(?:.*)\.(?:svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf)$/i.test(pathname);
}

function applyCacheHeaders(response: NextResponse, options: {
  vercel: string;
  cdn: string;
  browser: string;
}) {
  response.headers.set("Vercel-CDN-Cache-Control", options.vercel);
  response.headers.set("CDN-Cache-Control", options.cdn);
  response.headers.set("Cache-Control", options.browser);
}

export function middleware(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.toLowerCase();

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isBlockedScannerPath(normalizedPath)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=86400",
        "CDN-Cache-Control": "public, max-age=86400",
        "Vercel-CDN-Cache-Control": "public, max-age=86400",
        "X-Robots-Tag": "noindex, nofollow"
      }
    });
  }

  const response = NextResponse.next();

  if (isStaticPublicAsset(pathname)) {
    applyCacheHeaders(response, {
      vercel: PUBLIC_ASSET_CACHE,
      cdn: PUBLIC_ASSET_CACHE,
      browser: PUBLIC_ASSET_BROWSER_CACHE
    });
    return response;
  }

  applyCacheHeaders(response, {
    vercel: PUBLIC_PAGE_CACHE,
    cdn: PUBLIC_PAGE_CACHE,
    browser: PUBLIC_BROWSER_CACHE
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
