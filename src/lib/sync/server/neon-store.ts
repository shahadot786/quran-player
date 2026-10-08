import { neon } from "@neondatabase/serverless";
import type { SyncSnapshot } from "../types";
import type { SnapshotStore, StoredSnapshot } from "./store";

type Row = { data: SyncSnapshot; version: number };

export function createNeonStore(connectionString: string): SnapshotStore {
  const sql = neon(connectionString);

  const get = async (keyHash: string): Promise<StoredSnapshot | null> => {
    const rows = (await sql`select data, version from snapshots where key_hash = ${keyHash}`) as Row[];
    return rows[0] ? { version: rows[0].version, data: rows[0].data } : null;
  };

  return {
    get,
    async put(keyHash, data, sizeBytes, expectedVersion) {
      const json = JSON.stringify(data);
      const rows = (
        expectedVersion === 0
          ? await sql`
              insert into snapshots (key_hash, data, size_bytes) values (${keyHash}, ${json}::jsonb, ${sizeBytes})
              on conflict (key_hash) do nothing
              returning version`
          : await sql`
              update snapshots set data = ${json}::jsonb, size_bytes = ${sizeBytes}, version = version + 1, updated_at = now()
              where key_hash = ${keyHash} and version = ${expectedVersion}
              returning version`
      ) as { version: number }[];
      return rows[0] ? { ok: true, version: rows[0].version } : { ok: false, current: await get(keyHash) };
    },
    async remove(keyHash) {
      await sql`delete from snapshots where key_hash = ${keyHash}`;
    },
    async hit(bucket, windowStart) {
      const rows = (await sql`
        insert into rate_limits (bucket, window_start, hits) values (${bucket}, ${windowStart.toISOString()}::timestamptz, 1)
        on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
        returning hits`) as { hits: number }[];
      return rows[0]?.hits ?? 1;
    },
    async purge(snapshotsBefore, limitsBefore) {
      const [snapshots, limits] = (await sql.transaction([
        sql`with gone as (delete from snapshots where updated_at < ${snapshotsBefore.toISOString()}::timestamptz returning 1) select count(*)::int as n from gone`,
        sql`with gone as (delete from rate_limits where window_start < ${limitsBefore.toISOString()}::timestamptz returning 1) select count(*)::int as n from gone`,
      ])) as { n: number }[][];
      return { snapshots: snapshots?.[0]?.n ?? 0, rateLimits: limits?.[0]?.n ?? 0 };
    },
  };
}
