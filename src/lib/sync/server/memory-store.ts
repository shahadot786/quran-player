import type { SnapshotStore, StoredSnapshot } from "./store";

export type MemoryStore = SnapshotStore & {
  records: Map<string, StoredSnapshot & { sizeBytes: number; updatedAt: Date }>;
  counters: Map<string, number>;
};

export function createMemoryStore(now: () => Date = () => new Date()): MemoryStore {
  const records: MemoryStore["records"] = new Map();
  const counters: MemoryStore["counters"] = new Map();
  const windowKey = (bucket: string, windowStart: Date) => `${bucket}@${windowStart.toISOString()}`;

  return {
    records,
    counters,
    async get(keyHash) {
      const record = records.get(keyHash);
      return record ? { version: record.version, data: structuredClone(record.data) } : null;
    },
    async put(keyHash, data, sizeBytes, expectedVersion) {
      const current = records.get(keyHash);
      if ((current?.version ?? 0) !== expectedVersion) {
        return { ok: false, current: current ? { version: current.version, data: structuredClone(current.data) } : null };
      }
      const version = expectedVersion + 1;
      records.set(keyHash, { version, data: structuredClone(data), sizeBytes, updatedAt: now() });
      return { ok: true, version };
    },
    async remove(keyHash) {
      records.delete(keyHash);
    },
    async hit(bucket, windowStart) {
      const key = windowKey(bucket, windowStart);
      const hits = (counters.get(key) ?? 0) + 1;
      counters.set(key, hits);
      return hits;
    },
    async purge(snapshotsBefore, limitsBefore) {
      let snapshots = 0;
      for (const [hash, record] of records) {
        if (record.updatedAt < snapshotsBefore) {
          records.delete(hash);
          snapshots += 1;
        }
      }
      let rateLimits = 0;
      for (const key of counters.keys()) {
        if (new Date(key.slice(key.lastIndexOf("@") + 1)) < limitsBefore) {
          counters.delete(key);
          rateLimits += 1;
        }
      }
      return { snapshots, rateLimits };
    },
  };
}
