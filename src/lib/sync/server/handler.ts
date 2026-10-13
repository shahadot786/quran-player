import { timingSafeEqual } from "node:crypto";
import { hashKey, isAuthToken, isLegacyKey } from "../key";
import { isSyncSnapshot } from "../snapshot";
import { checkLimits, LIMITS, type Limit } from "./rate-limit";
import type { SnapshotStore } from "./store";

export const MAX_BODY_BYTES = 256 * 1024;
const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const LIMIT_ROWS_MS = 24 * 60 * 60 * 1000;

export type SyncDeps = { store: SnapshotStore | null; now: () => Date; secret: string };

const NO_STORE = { "Cache-Control": "no-store" };
const reply = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  body === undefined ? new Response(null, { status, headers: { ...NO_STORE, ...headers } }) : Response.json(body, { status, headers: { ...NO_STORE, ...headers } });

function bearer(request: Request): string | null {
  const match = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "");
  return match ? match[1]! : null;
}

// Addresses are only kept as a keyed hash, so the counters can't be turned back into who visited.
async function ipBucket(request: Request, secret: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${await hashKey(`${secret}:${forwarded}`)}`;
}

// Reads at most `max` bytes, so an oversized body is dropped as it arrives and never held in memory.
async function readLimited(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function limited(deps: SyncDeps & { store: SnapshotStore }, limits: Limit[]) {
  const wait = await checkLimits(deps.store, limits, deps.now());
  return wait === null ? null : reply(429, { error: "rate-limited" }, { "Retry-After": String(wait) });
}

export async function handleSync(request: Request, method: "GET" | "PUT" | "DELETE", deps: SyncDeps): Promise<Response> {
  const key = bearer(request);
  // Codes arrive as the long token the device derived from them; only keys from before codes are sent as they are.
  if (key === null || (!isLegacyKey(key) && !isAuthToken(key))) return reply(401, { error: "invalid-key" });
  if (!deps.store) return reply(503, { error: "not-configured" });
  const store = deps.store;
  const ready = { ...deps, store };

  try {
    const keyHash = await hashKey(key);
    const ip = await ipBucket(request, deps.secret);
    const anyPerIp: Limit = { bucket: `${ip}:any`, max: LIMITS.anyPerIp, window: "hour" };

    if (method === "GET") {
      const blocked = await limited(ready, [anyPerIp, { bucket: `get:${keyHash}`, max: LIMITS.getPerKey, window: "hour" }]);
      if (blocked) return blocked;
      const stored = await store.get(keyHash);
      return stored ? reply(200, { version: stored.version, snapshot: stored.data }) : reply(404, { error: "not-found" });
    }

    if (method === "DELETE") {
      const blocked = await limited(ready, [anyPerIp, { bucket: `del:${keyHash}`, max: LIMITS.deletePerKey, window: "hour" }]);
      if (blocked) return blocked;
      await store.remove(keyHash);
      return reply(204);
    }

    const blocked = await limited(ready, [anyPerIp, { bucket: `put:${keyHash}`, max: LIMITS.putPerKey, window: "hour" }]);
    if (blocked) return blocked;

    const text = await readLimited(request, MAX_BODY_BYTES);
    if (text === null) return reply(413, { error: "too-large" });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return reply(422, { error: "rejected" });
    }
    const { baseVersion, snapshot } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
    if (typeof baseVersion !== "number" || !Number.isInteger(baseVersion) || baseVersion < 0 || !isSyncSnapshot(snapshot)) {
      return reply(422, { error: "rejected" });
    }

    if (baseVersion === 0) {
      const registrations = await limited(ready, [{ bucket: `${ip}:new`, max: LIMITS.registrationsPerIp, window: "day" }]);
      if (registrations) return registrations;
    }
    const outcome = await store.put(keyHash, snapshot, Buffer.byteLength(JSON.stringify(snapshot)), baseVersion);
    if (outcome.ok) return reply(200, { version: outcome.version });
    return reply(409, outcome.current ? { version: outcome.current.version, snapshot: outcome.current.data } : { version: 0, snapshot: null });
  } catch {
    return reply(500, { error: "server" });
  }
}

export async function handleCleanup(request: Request, deps: SyncDeps): Promise<Response> {
  const given = Buffer.from(bearer(request) ?? "");
  const expected = Buffer.from(deps.secret);
  if (!deps.secret || given.length !== expected.length || !timingSafeEqual(given, expected)) return reply(401, { error: "unauthorized" });
  if (!deps.store) return reply(503, { error: "not-configured" });
  try {
    const now = deps.now().getTime();
    const { snapshots, rateLimits } = await deps.store.purge(new Date(now - RETENTION_MS), new Date(now - LIMIT_ROWS_MS));
    return reply(200, { deleted: snapshots, rateLimitsDeleted: rateLimits });
  } catch {
    return reply(500, { error: "server" });
  }
}
