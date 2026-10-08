import type { SyncSnapshot } from "../types";

export type StoredSnapshot = { version: number; data: SyncSnapshot };
export type PutOutcome = { ok: true; version: number } | { ok: false; current: StoredSnapshot | null };

/** Everything the sync routes need from a database, so Neon can be swapped for another one without touching them. */
export type SnapshotStore = {
  get: (keyHash: string) => Promise<StoredSnapshot | null>;
  /** `expectedVersion` 0 creates the record; anything else updates it only if it is still at that version. */
  put: (keyHash: string, data: SyncSnapshot, sizeBytes: number, expectedVersion: number) => Promise<PutOutcome>;
  remove: (keyHash: string) => Promise<void>;
  /** Counts one more hit in the bucket's window and returns the total so far. */
  hit: (bucket: string, windowStart: Date) => Promise<number>;
  /** Removes snapshots untouched since `snapshotsBefore` and counters from windows before `limitsBefore`. */
  purge: (snapshotsBefore: Date, limitsBefore: Date) => Promise<{ snapshots: number; rateLimits: number }>;
};
