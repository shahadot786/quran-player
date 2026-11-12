import "server-only";
import { SITE_URL } from "@/lib/site";
import { createMemoryTracker, type MemoryTracker } from "./memory-tracker";
import { createNeonTracker } from "./neon-tracker";
import type { WidgetDeps } from "./handler";
import type { WidgetStore } from "./store";

let cached: { url: string; store: WidgetStore } | null = null;

// Pages and route handlers are bundled apart, so the test store lives on globalThis to be one store for both.
const shared = globalThis as { widgetTestStore?: MemoryTracker };

function storeFromEnv(): WidgetStore | null {
  const url = process.env.DATABASE_URL;
  // Only the end-to-end tests set this: a throwaway in-memory store instead of a database.
  if (!url && process.env.WIDGET_TEST_STORE === "memory") return (shared.widgetTestStore ??= createMemoryTracker());
  if (!url) return null;
  if (cached?.url !== url) cached = { url, store: createNeonTracker(url) };
  return cached.store;
}

export const widgetDeps = (): WidgetDeps => ({
  store: storeFromEnv(),
  now: () => new Date(),
  salt: process.env.WIDGET_SALT ?? "",
  secret: process.env.CRON_SECRET ?? "",
  siteOrigin: new URL(SITE_URL).origin,
});
