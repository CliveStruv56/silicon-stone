import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { articleRedirectRules } from "./src/lib/slug-redirects";

const isDevelopment = process.env.NODE_ENV === 'development'
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  'https://plausible.io',
].join(' ')

// The Railway logic backend that IntelligenceFeed fetches briefings from
// client-side. Derived from the env var (NEXT_PUBLIC_ vars are inlined at
// build time) so connect-src stays in sync with the deploy target.
const backendOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
})()

const connectSrc = [
  "'self'",
  'https://plausible.io',
  'https://api.kit.com',
  'https://cdn.sanity.io',
  'https://*.api.sanity.io',
  'wss://*.api.sanity.io',
  'https://basemaps.cartocdn.com',
  'https://*.basemaps.cartocdn.com',
  ...(backendOrigin ? [backendOrigin] : []),
].join(' ')

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.basemaps.cartocdn.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ['@pinecone-database/pinecone', 'mammoth'],
  experimental: {
    // Allow .docx / .md uploads through the /import server action.
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    // Phase B route consolidation — permanent 301s for moved routes. Article
    // and category URLs (/analysis/[slug], /analysis/category/[slug]) are
    // deliberately preserved; only the two index pages fold into /intelligence.
    const routeRedirects = [
      { source: '/analysis', destination: '/intelligence', statusCode: 301 },
      { source: '/briefings', destination: '/intelligence', statusCode: 301 },
      { source: '/services', destination: '/advisory', statusCode: 301 },
      { source: '/products/briefings', destination: '/products/sector-reports', statusCode: 301 },
    ]
    // 301s for renamed article slugs (see src/lib/slug-redirects.ts).
    return [...routeRedirects, ...articleRedirectRules()]
  },
  async headers() {
    return [
      {
        // The service worker must never be served stale, or deploys would
        // take a full HTTP-cache TTL to reach installed clients.
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // No service worker in `next dev` — HMR and the SW cache fight each other.
  disable: isDevelopment,
  additionalPrecacheEntries: [
    // Offline fallback document (see fallbacks in src/app/sw.ts). Fresh
    // revision per build so a deploy refreshes the cached copy.
    { url: "/offline", revision: crypto.randomUUID() },
    // Saved-articles shell: must open with the network disabled — the reader
    // inside it renders saved articles from IndexedDB (P2-4).
    { url: "/saved", revision: crypto.randomUUID() },
  ],
});

export default withSerwist(nextConfig);
