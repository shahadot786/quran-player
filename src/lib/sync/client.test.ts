import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeSyncApi } from "@/test/fake-sync-api";
import { resetStores } from "@/test/reset-stores";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore } from "@/stores/zikir-store";
import { httpApi, runSync, SyncError, type LocalData } from "./client";
import { authToken, generateKey } from "./key";
import { readLocalSnapshot, writeLocalSnapshot } from "./local";
import { mergeSnapshots } from "./merge";
import type { SyncSnapshot } from "./types";

const blank = (): SyncSnapshot => ({
  library: { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] },
  stats: { totalSeconds: 0, daily: {}, reciters: {}, completed: {} },
  progress: { slices: {}, lifetime: {}, rounds: [], currentRound: 1, roundStartedAt: null, roundSeconds: 0, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: null },
  zikir: { items: [], groups: [], counts: {}, history: [], builtIns: {} },
});

function device(patch: (data: SyncSnapshot) => void = () => {}) {
  const data = blank();
  patch(data);
  data.stats.totalSeconds = Object.values(data.stats.daily).reduce((total, seconds) => total + seconds, 0);
  const local: LocalData = {
    read: () => structuredClone(data),
    write: (next) => {
      Object.assign(data, structuredClone(next));
    },
  };
  return { data, local };
}

const key = generateKey();

describe("runSync", () => {
  it("uploads on the first sync and does nothing on the second", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 60));
    expect(await runSync({ api: cloud.api, key, local: phone.local })).toEqual({ version: 1, uploaded: true });
    expect(await runSync({ api: cloud.api, key, local: phone.local })).toEqual({ version: 1, uploaded: false });
    expect(cloud.calls.put).toBe(1);
  });

  it("brings the cloud copy onto a clean device and keeps what that device already had", async () => {
    const cloud = createFakeSyncApi();
    await runSync({ api: cloud.api, key, local: device((d) => (d.stats.daily["2026-10-01"] = 60)).local });
    const laptop = device((d) => (d.stats.daily["2026-10-02"] = 30));
    await runSync({ api: cloud.api, key, local: laptop.local });
    expect(laptop.data.stats.daily).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
    expect(cloud.records.get(key)!.snapshot.stats.daily).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
  });

  it("two devices converge and neither loses what the other had", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.zikir.counts["2026-10-01"] = { x: { phone: { n: 5, at: 1 } } }));
    const laptop = device((d) => (d.zikir.counts["2026-10-01"] = { x: { laptop: { n: 7, at: 2 } } }));
    await runSync({ api: cloud.api, key, local: phone.local });
    await runSync({ api: cloud.api, key, local: laptop.local });
    await runSync({ api: cloud.api, key, local: phone.local });
    expect(phone.data).toEqual(laptop.data);
    expect(phone.data.zikir.counts["2026-10-01"]!.x).toEqual({ phone: { n: 5, at: 1 }, laptop: { n: 7, at: 2 } });
  });

  it("merges again and retries when another device saved in between", async () => {
    const cloud = createFakeSyncApi();
    const laptop = device((d) => (d.stats.daily["2026-10-02"] = 30));
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 60));
    await runSync({ api: cloud.api, key, local: phone.local });
    cloud.beforeNextPut(() => {
      const record = cloud.records.get(key)!;
      record.snapshot = mergeSnapshots(record.snapshot, device((d) => (d.stats.daily["2026-10-03"] = 5)).data);
      record.version += 1;
    });
    const outcome = await runSync({ api: cloud.api, key, local: laptop.local });
    expect(outcome.uploaded).toBe(true);
    expect(laptop.data.stats.daily).toEqual({ "2026-10-01": 60, "2026-10-02": 30, "2026-10-03": 5 });
    expect(cloud.records.get(key)!.snapshot.stats.daily).toEqual(laptop.data.stats.daily);
  });

  it("gives up with a conflict when the cloud keeps changing", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 1));
    await runSync({ api: cloud.api, key, local: phone.local });
    phone.data.stats.daily["2026-10-02"] = 2;
    const api = { ...cloud.api, put: vi.fn(async () => ({ ok: false as const, version: 9, snapshot: cloud.records.get(key)!.snapshot })) };
    await expect(runSync({ api, key, local: phone.local })).rejects.toMatchObject({ code: "conflict" });
    expect(api.put).toHaveBeenCalledTimes(3);
  });

  it("starts again from nothing when the cloud copy was deleted meanwhile", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 1));
    await runSync({ api: cloud.api, key, local: phone.local });
    phone.data.stats.daily["2026-10-02"] = 2;
    cloud.beforeNextPut(() => cloud.records.delete(key));
    await expect(runSync({ api: cloud.api, key, local: phone.local })).resolves.toEqual({ version: 1, uploaded: true });
  });

  it("keeps local data and reports the error when the network or server fails", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 60));
    for (const code of ["offline", "rate-limited", "invalid-key", "server"] as const) {
      cloud.failNext(new SyncError(code));
      await expect(runSync({ api: cloud.api, key, local: phone.local })).rejects.toMatchObject({ code });
    }
    expect(phone.data.stats.daily).toEqual({ "2026-10-01": 60 });
    expect(cloud.records.size).toBe(0);
  });

  it("refuses to restore from a key that has nothing behind it, without uploading", async () => {
    const cloud = createFakeSyncApi();
    const phone = device((d) => (d.stats.daily["2026-10-01"] = 60));
    await expect(runSync({ api: cloud.api, key, local: phone.local, requireRemote: true })).rejects.toMatchObject({ code: "not-found" });
    expect(cloud.calls.put).toBe(0);
  });

  it("does not trust a cloud copy that is not a valid snapshot", async () => {
    const api = { get: async () => ({ version: 1, snapshot: { library: 1 } }), put: vi.fn(), remove: vi.fn() };
    await expect(runSync({ api, key, local: device().local })).rejects.toMatchObject({ code: "server" });
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("local data", () => {
  afterEach(() => resetStores());

  it("reads the stores into a snapshot and writes a merged one back, keeping rounds in progress", () => {
    useStatsStore.setState({ daily: { "2026-10-01": 60 }, totalSeconds: 60 });
    useZikirStore.setState({ runs: { "item:x": { kind: "item", id: "x", step: 0, count: 3, startedAt: 1, updatedAt: 1 } } });
    const snapshot = readLocalSnapshot();
    expect(snapshot.stats.daily).toEqual({ "2026-10-01": 60 });
    writeLocalSnapshot({ ...snapshot, stats: { ...snapshot.stats, daily: { "2026-10-01": 60, "2026-10-02": 5 } } });
    expect(useStatsStore.getState().daily).toEqual({ "2026-10-01": 60, "2026-10-02": 5 });
    expect(useZikirStore.getState().runs["item:x"]).toBeDefined();
  });
});

describe("httpApi", () => {
  afterEach(() => vi.unstubAllGlobals());
  const respond = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(status === 204 ? null : JSON.stringify(body), { status, headers })));

  it("sends a token derived from the code, never the words, and only in the Authorization header", async () => {
    respond(200, { version: 1, snapshot: blank() });
    await httpApi.get(key);
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toBe("/api/sync");
    expect((init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${await authToken(key)}`);
    expect((init!.headers as Record<string, string>).Authorization).not.toContain(key.split("-")[0]!);
  });

  it("reads 404 as no cloud copy and a 409 as a conflict carrying the cloud copy", async () => {
    respond(404);
    expect(await httpApi.get(key)).toBeNull();
    respond(409, { version: 4, snapshot: blank() });
    expect(await httpApi.put(key, 3, blank())).toMatchObject({ ok: false, version: 4 });
  });

  it("maps failures to error codes, keeping Retry-After", async () => {
    respond(429, {}, { "Retry-After": "120" });
    await expect(httpApi.get(key)).rejects.toMatchObject({ code: "rate-limited", retryAfter: 120 });
    respond(401);
    await expect(httpApi.get(key)).rejects.toMatchObject({ code: "invalid-key" });
    respond(413);
    await expect(httpApi.put(key, 0, blank())).rejects.toMatchObject({ code: "too-large" });
    respond(500);
    await expect(httpApi.remove(key)).rejects.toMatchObject({ code: "server" });
  });

  it("reports offline when the request cannot be made", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(httpApi.get(key)).rejects.toMatchObject({ code: "offline" });
  });
});
