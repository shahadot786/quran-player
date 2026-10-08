import "server-only";
import { createNeonStore } from "./neon-store";
import type { SyncDeps } from "./handler";
import type { SnapshotStore } from "./store";

let cached: { url: string; store: SnapshotStore } | null = null;

function storeFromEnv(): SnapshotStore | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (cached?.url !== url) cached = { url, store: createNeonStore(url) };
  return cached.store;
}

export const syncDeps = (): SyncDeps => ({ store: storeFromEnv(), now: () => new Date(), secret: process.env.CRON_SECRET ?? "" });
