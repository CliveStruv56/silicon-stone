/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import {
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

// Injected by @serwist/next at build time.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Custom routes run before defaultCache, overriding its generic handling
// where the defaults are wrong for this site.
const runtimeCaching: RuntimeCaching[] = [
  // Never cache API responses. defaultCache would NetworkFirst-cache them;
  // /api/* carries newsletter, live briefings and (later) commerce and
  // entitlement payloads that must never be served stale or offline.
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin && pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // Editor / protected surfaces: never store their HTML or assets.
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin &&
      (pathname.startsWith("/studio") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login")),
    handler: new NetworkOnly(),
  },
  // Sanity image CDN: serve from cache immediately, refresh in the background.
  // Bounded so article-heavy browsing can't grow the cache without limit.
  {
    matcher: ({ url }) => url.hostname === "cdn.sanity.io",
    handler: new StaleWhileRevalidate({
      cacheName: "sanity-images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Immediate activation on deploy: this is a content site with no long-lived
  // client state, so we prefer never-stale over an update prompt.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        // Precached via additionalPrecacheEntries in next.config.ts.
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
