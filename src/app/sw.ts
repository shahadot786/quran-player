/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, createPartialResponse } from "serwist";
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
    // The default API cache is keyed by URL alone, so it would hand one person's cloud copy to another key when offline.
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/sync"),
      handler: new NetworkOnly(),
    },
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

// A tapped reminder opens its page in a window that is already open, or a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      return open ? open.focus().then((client) => client.navigate(url)) : self.clients.openWindow(url);
    }),
  );
});
