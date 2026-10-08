// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKey, hashKey } from "../key";
import type { SyncSnapshot } from "../types";
import { handleCleanup, handleSync, MAX_BODY_BYTES, type SyncDeps } from "./handler";
import { createMemoryStore } from "./memory-store";
import { LIMITS } from "./rate-limit";

const SECRET = "test-secret";
const blank = (): SyncSnapshot => ({
  library: { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] },
  stats: { totalSeconds: 0, daily: {}, reciters: {}, completed: {} },
  progress: { slices: {}, lifetime: {}, rounds: [], currentRound: 1, roundStartedAt: null, roundSeconds: 0, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: null },
  zikir: { items: [], groups: [], counts: {}, history: [], builtIns: {} },
});

function setup(start = new Date("2026-10-08T10:00:00Z")) {
  const store = createMemoryStore(() => clock.now);
  const clock = { now: start };
  const deps: SyncDeps = { store, now: () => clock.now, secret: SECRET };
  const call = (method: "GET" | "PUT" | "DELETE", key: string | null, init: { body?: unknown; ip?: string; headers?: Record<string, string> } = {}) =>
    handleSync(
      new Request("https://app.test/api/sync", {
        method,
        headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), "x-forwarded-for": init.ip ?? "203.0.113.7", ...init.headers },
        body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
      }),
      method,
      deps,
    );
  const put = (key: string | null, baseVersion: number, snapshot: unknown = blank(), ip?: string) => call("PUT", key, { body: { baseVersion, snapshot }, ip });
  return { store, clock, deps, call, put };
}

afterEach(() => vi.restoreAllMocks());

describe("authentication", () => {
  it("rejects a missing, malformed or wrongly formed key with 401, before touching the database", async () => {
    const { call, store } = setup();
    const hit = vi.spyOn(store, "hit");
    for (const key of [null, "short", "a".repeat(44), "abandon-ability-able", `${generateKey()}-able`, generateKey().toUpperCase()]) {
      const response = await call("GET", key);
      expect(response.status).toBe(401);
    }
    expect((await call("GET", null, { headers: { Authorization: "Basic abc" } })).status).toBe(401);
    expect(hit).not.toHaveBeenCalled();
  });

  it("answers 503 when no database is configured", async () => {
    const response = await handleSync(new Request("https://app.test/api/sync", { headers: { Authorization: `Bearer ${generateKey()}` } }), "GET", {
      store: null,
      now: () => new Date(),
      secret: SECRET,
    });
    expect(response.status).toBe(503);
  });
});

describe("save and fetch", () => {
  it("has nothing for a new key, creates on the first save and bumps the version after", async () => {
    const { call, put } = setup();
    const key = generateKey();
    expect((await call("GET", key)).status).toBe(404);

    const first = await put(key, 0);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ version: 1 });
    expect(await (await put(key, 1)).json()).toEqual({ version: 2 });

    const fetched = await call("GET", key);
    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toEqual({ version: 2, snapshot: blank() });
  });

  it("sends nothing to be cached", async () => {
    const { call, put } = setup();
    const key = generateKey();
    for (const response of [await call("GET", key), await put(key, 0), await call("DELETE", key)]) {
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("stores only the hash of the key, and never an address in readable form", async () => {
    const { put, store } = setup();
    const key = generateKey();
    await put(key, 0, blank(), "198.51.100.23");
    expect([...store.records.keys()]).toEqual([await hashKey(key)]);
    const everything = JSON.stringify([...store.records.keys(), ...store.counters.keys()]);
    expect(everything).not.toContain(key);
    expect(everything).not.toContain("198.51.100.23");
  });

  it("deletes the record, also when there is none, and then has nothing for the key", async () => {
    const { call, put } = setup();
    const key = generateKey();
    await put(key, 0);
    expect((await call("DELETE", key)).status).toBe(204);
    expect((await call("DELETE", key)).status).toBe(204);
    expect((await call("GET", key)).status).toBe(404);
  });
});

describe("isolation and concurrency", () => {
  it("never lets one key read, overwrite or delete another key's record", async () => {
    const { call, put, store } = setup();
    const [a, b] = [generateKey(), generateKey()];
    const mine = blank();
    mine.stats = { totalSeconds: 5, daily: { "2026-10-01": 5 }, reciters: {}, completed: {} };
    await put(a, 0, mine);
    expect((await call("GET", b)).status).toBe(404);
    await put(b, 0, blank());
    expect(((await (await call("GET", a)).json()) as { snapshot: SyncSnapshot }).snapshot.stats.daily).toEqual({ "2026-10-01": 5 });
    await call("DELETE", b);
    expect(store.records.size).toBe(1);
    expect((await call("GET", a)).status).toBe(200);
  });

  it("answers 409 with the current copy when the base version is stale, and lets only one of two pushes win", async () => {
    const { put } = setup();
    const key = generateKey();
    await put(key, 0);
    const [one, two] = await Promise.all([put(key, 1), put(key, 1)]);
    expect([one.status, two.status].sort()).toEqual([200, 409]);
    const loser = one.status === 409 ? one : two;
    expect(await loser.json()).toEqual({ version: 2, snapshot: blank() });
  });

  it("answers 409 with no copy when the client believes in a version but the record is gone", async () => {
    const { put } = setup();
    const response = await put(generateKey(), 4);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ version: 0, snapshot: null });
  });

  it("answers 409 when a first save finds a record that already exists", async () => {
    const { put } = setup();
    const key = generateKey();
    await put(key, 0);
    expect((await put(key, 0)).status).toBe(409);
  });
});

describe("validation", () => {
  it("answers 422 for bad JSON, a bad version or a snapshot of the wrong shape", async () => {
    const { call, put } = setup();
    const key = generateKey();
    expect((await call("PUT", key, { body: "{not json" })).status).toBe(422);
    expect((await call("PUT", key, { body: {} })).status).toBe(422);
    expect((await put(key, -1)).status).toBe(422);
    expect((await put(key, 1.5)).status).toBe(422);
    expect((await put(key, "0" as unknown as number)).status).toBe(422);
    const wrong = { ...blank(), stats: { ...blank().stats, daily: { "2026-10-01": "lots" } } };
    expect((await put(key, 0, wrong)).status).toBe(422);
    expect((await put(key, 0, { ...blank(), progress: undefined })).status).toBe(422);
  });

  it("answers 413 for a body over the cap, going by the declared size", async () => {
    const { call } = setup();
    const response = await call("PUT", generateKey(), { body: "x", headers: { "content-length": String(MAX_BODY_BYTES + 1) } });
    expect(response.status).toBe(413);
  });

  it("stops reading a body that grows past the cap instead of buffering it", async () => {
    const { deps } = setup();
    let pulled = 0;
    const chunk = new Uint8Array(64 * 1024).fill(97);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 100) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const request = new Request("https://app.test/api/sync", { method: "PUT", headers: { Authorization: `Bearer ${generateKey()}` }, body, duplex: "half" } as RequestInit);
    expect((await handleSync(request, "PUT", deps)).status).toBe(413);
    expect(pulled).toBeLessThan(10);
  });
});

describe("limits", () => {
  it("answers 429 with Retry-After once a key has saved too often in an hour, and recovers in the next hour", async () => {
    const { put, clock } = setup(new Date("2026-10-08T10:00:00Z"));
    const key = generateKey();
    let version = 0;
    for (let i = 0; i < LIMITS.putPerKey; i += 1) {
      const response = await put(key, version, blank(), `10.0.0.${i}`);
      expect(response.status).toBe(200);
      version += 1;
    }
    const blocked = await put(key, version, blank(), "10.0.1.1");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBe(3600);
    clock.now = new Date("2026-10-08T11:00:01Z");
    expect((await put(key, version, blank(), "10.0.1.2")).status).toBe(200);
  });

  it("limits any request per address", async () => {
    const { call } = setup();
    const statuses: number[] = [];
    for (let i = 0; i <= LIMITS.anyPerIp; i += 1) statuses.push((await call("GET", generateKey(), { ip: "192.0.2.1" })).status);
    expect(statuses.slice(0, LIMITS.anyPerIp).every((status) => status === 404)).toBe(true);
    expect(statuses[LIMITS.anyPerIp]).toBe(429);
    expect((await call("GET", generateKey(), { ip: "192.0.2.2" })).status).toBe(404);
  });

  it("limits how many new keys one address can register in a day", async () => {
    const { put } = setup();
    for (let i = 0; i < LIMITS.registrationsPerIp; i += 1) expect((await put(generateKey(), 0, blank(), "192.0.2.9")).status).toBe(200);
    const blocked = await put(generateKey(), 0, blank(), "192.0.2.9");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});

describe("failures and privacy", () => {
  it("answers 500 without leaking details when the database fails, and logs nothing", async () => {
    const { call, store } = setup();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(store, "get").mockRejectedValue(new Error("connection string postgres://user:secret@host"));
    const response = await call("GET", generateKey());
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    expect(log).not.toHaveBeenCalled();
  });
});

describe("cleanup", () => {
  const cleanup = (deps: SyncDeps, token?: string) =>
    handleCleanup(new Request("https://app.test/api/sync/cleanup", { headers: token ? { Authorization: `Bearer ${token}` } : {} }), deps);

  it("requires the shared secret", async () => {
    const { deps } = setup();
    expect((await cleanup(deps)).status).toBe(401);
    expect((await cleanup(deps, "wrong-secret")).status).toBe(401);
    expect((await cleanup({ ...deps, secret: "" }, "")).status).toBe(401);
  });

  it("removes snapshots untouched for a year and old counters, and keeps the rest", async () => {
    const { deps, put, clock, store } = setup(new Date("2025-10-01T00:00:00Z"));
    const old = generateKey();
    await put(old, 0);
    clock.now = new Date("2026-09-01T00:00:00Z");
    const recent = generateKey();
    await put(recent, 0);
    clock.now = new Date("2026-10-08T00:00:00Z");

    const response = await cleanup(deps, SECRET);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ deleted: 1 });
    expect([...store.records.keys()]).toEqual([await hashKey(recent)]);
    expect([...store.counters.keys()].every((key) => key.includes("2026-10") || key.includes("2026-09"))).toBe(true);
  });
});
