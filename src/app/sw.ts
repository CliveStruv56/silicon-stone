/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import {
  BackgroundSyncQueue,
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

// Offline action queue (P2-6): outbound form submissions that fail at the
// network level are stored (IndexedDB, 24h retention) and replayed — via the
// Background Sync API where supported (Chromium), or when the page reports
// the connection returned (REPLAY_SUBMISSIONS message below; Safari/iOS has
// no Background Sync). Only network failures queue; HTTP errors pass through
// to the form, so rejected submissions are never retried (no duplicates).
const submissionQueue = new BackgroundSyncQueue("ss-submissions", {
  maxRetentionTime: 24 * 60,
});

const QUEUEABLE_SUBMISSIONS = new Set(["/api/subscribe", "/api/contact"]);

// Custom routes run before defaultCache, overriding its generic handling
// where the defaults are wrong for this site.
const runtimeCaching: RuntimeCaching[] = [
  // Newsletter signups and contact messages: send, and queue on network
  // failure. Must precede the generic /api/* NetworkOnly route.
  {
    matcher: ({ sameOrigin, request, url: { pathname } }) =>
      sameOrigin &&
      request.method === "POST" &&
      QUEUEABLE_SUBMISSIONS.has(pathname),
    method: "POST",
    handler: async ({ request }) => {
      try {
        return await fetch(request.clone());
      } catch (error) {
        await submissionQueue.pushRequest({ request });
        throw error;
      }
    },
  },
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
  // Sanity image CDN. Saved-for-later images live in a dedicated cache the
  // save action populates (see src/lib/offline/article-store.ts) and are
  // served from there first — they must survive offline regardless of what
  // the bounded browsing cache below has evicted. Everything else is
  // stale-while-revalidate with an LRU cap.
  {
    matcher: ({ url }) => url.hostname === "cdn.sanity.io",
    handler: (options) => savedImagesFirst(options),
  },
  ...defaultCache,
];

/** Keep in sync with IMAGES_CACHE in src/lib/offline/article-store.ts. */
const SAVED_IMAGES_CACHE = "ss-saved-images";

const sanityImagesBrowsing = new StaleWhileRevalidate({
  cacheName: "sanity-images",
  plugins: [
    new ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 30 * 24 * 60 * 60,
      maxAgeFrom: "last-used",
    }),
  ],
});

async function savedImagesFirst(
  options: Parameters<StaleWhileRevalidate["handle"]>[0],
): Promise<Response> {
  const saved = await caches.match(options.request, {
    cacheName: SAVED_IMAGES_CACHE,
  });
  if (saved) return saved;
  return sanityImagesBrowsing.handle(options);
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // Ignore client-state params when matching precached documents, so an
    // offline navigation to /saved?read=<slug> (the saved-article reader,
    // P2-4/P2-5) or /?source=pwa (manifest start_url) still hits the
    // precached shell.
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^read$/, /^source$/],
  },
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

// Safari/iOS fallback: no Background Sync, so the page pings us when the
// 'online' event fires (see OfflineBanner) and we drain the queue then.
// Harmless on Chromium — replaying an empty queue is a no-op.
self.addEventListener("message", (event) => {
  if (event.data?.type === "REPLAY_SUBMISSIONS") {
    event.waitUntil(
      submissionQueue.replayRequests().catch(() => {
        // A replay that fails mid-way re-queues the remainder; the next
        // sync event or online ping tries again.
      }),
    );
  }
});
