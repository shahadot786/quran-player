import type { SnapshotStore } from "./store";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type Limit = { bucket: string; max: number; window: "hour" | "day" };

export const LIMITS = {
  getPerKey: 120,
  putPerKey: 30,
  deletePerKey: 30,
  anyPerIp: 300,
  registrationsPerIp: 10,
} as const;

const span = (window: Limit["window"]) => (window === "hour" ? HOUR_MS : DAY_MS);

/** Counts every limit that applies and returns the seconds to wait if one is used up, or null when the request may go on. */
export async function checkLimits(store: SnapshotStore, limits: Limit[], now: Date): Promise<number | null> {
  for (const { bucket, max, window } of limits) {
    const length = span(window);
    const start = Math.floor(now.getTime() / length) * length;
    if ((await store.hit(bucket, new Date(start))) > max) return Math.max(1, Math.ceil((start + length - now.getTime()) / 1000));
  }
  return null;
}
