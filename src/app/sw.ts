/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist, createPartialResponse } from "serwist";
import { AUDIO_CACHE } from "@/lib/cache-names";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname === "/api/timings",
      handler: new CacheFirst({ cacheName: "qp-timings", plugins: [new ExpirationPlugin({ maxEntries: 300 })] }),
    },
    {
      matcher: ({ url }) => url.pathname.endsWith(".mp3"),
      handler: async ({ request }) => {
        const cached = await caches.open(AUDIO_CACHE).then((cache) => cache.match(request.url));
        if (!cached) return fetch(request);
        return request.headers.has("range") ? createPartialResponse(request, cached) : cached;
      },
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
