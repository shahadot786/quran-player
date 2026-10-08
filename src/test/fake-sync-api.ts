import { SyncError, type PutResult, type RemoteCopy, type SyncApi } from "@/lib/sync/client";
import type { SyncSnapshot } from "@/lib/sync/types";

/** A cloud in memory with the same rules as the real endpoints: a version per key and a refusal of stale pushes. */
export function createFakeSyncApi() {
  const records = new Map<string, { version: number; snapshot: SyncSnapshot }>();
  const calls = { get: 0, put: 0, remove: 0 };
  const failures: SyncError[] = [];
  let beforePut: (() => void) | null = null;

  const fail = () => {
    const next = failures.shift();
    if (next) throw next;
  };

  const api: SyncApi = {
    async get(key): Promise<RemoteCopy | null> {
      calls.get += 1;
      fail();
      const record = records.get(key);
      return record ? { version: record.version, snapshot: structuredClone(record.snapshot) } : null;
    },
    async put(key, baseVersion, snapshot): Promise<PutResult> {
      calls.put += 1;
      fail();
      beforePut?.();
      beforePut = null;
      const record = records.get(key);
      if ((record?.version ?? 0) !== baseVersion) return { ok: false, version: record?.version ?? 0, snapshot: record ? structuredClone(record.snapshot) : null };
      const version = baseVersion + 1;
      records.set(key, { version, snapshot: structuredClone(snapshot) });
      return { ok: true, version };
    },
    async remove(key) {
      calls.remove += 1;
      fail();
      records.delete(key);
    },
  };

  return {
    api,
    records,
    calls,
    failNext: (error: SyncError) => failures.push(error),
    /** Runs just before the next push, to play another device saving first. */
    beforeNextPut: (action: () => void) => {
      beforePut = action;
    },
  };
}
