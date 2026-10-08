import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SyncError } from "@/lib/sync/client";
import { generateKey } from "@/lib/sync/key";
import { useStatsStore } from "@/stores/stats-store";
import { useSyncStore } from "@/stores/sync-store";
import { createFakeSyncApi } from "@/test/fake-sync-api";
import { resetStores } from "@/test/reset-stores";
import { useSync } from "./use-sync";

beforeEach(() => resetStores());
afterEach(() => resetStores());

const listen = (day: string, seconds: number) => useStatsStore.setState({ daily: { [day]: seconds }, totalSeconds: seconds });

describe("useSync", () => {
  it("makes one key and keeps it", () => {
    const first = useSyncStore.getState().ensureKey();
    expect(useSyncStore.getState().ensureKey()).toBe(first);
  });

  it("uploads on sync and remembers when", async () => {
    const cloud = createFakeSyncApi();
    listen("2026-10-01", 60);
    const { result } = renderHook(() => useSync(cloud.api));
    await act(async () => expect(await result.current.sync()).toEqual({ ok: true }));
    expect(cloud.records.size).toBe(1);
    expect(useSyncStore.getState().lastSyncedAt).not.toBeNull();
    expect(result.current.busy).toBeNull();
  });

  it("reports an error code and leaves the data and the last sync time alone", async () => {
    const cloud = createFakeSyncApi();
    listen("2026-10-01", 60);
    cloud.failNext(new SyncError("offline"));
    const { result } = renderHook(() => useSync(cloud.api));
    await act(async () => expect(await result.current.sync()).toEqual({ ok: false, error: "offline" }));
    expect(useStatsStore.getState().daily).toEqual({ "2026-10-01": 60 });
    expect(useSyncStore.getState().lastSyncedAt).toBeNull();
  });

  it("restores a clean device from a key, tolerating copied spaces, and then uses that key", async () => {
    const cloud = createFakeSyncApi();
    listen("2026-10-01", 60);
    const phone = renderHook(() => useSync(cloud.api));
    await act(async () => void (await phone.result.current.sync()));
    const key = useSyncStore.getState().key!;

    resetStores();
    expect(useStatsStore.getState().daily).toEqual({});
    const laptop = renderHook(() => useSync(cloud.api));
    await act(async () => expect(await laptop.result.current.restore(` ${key}\n`)).toEqual({ ok: true }));
    expect(useStatsStore.getState().daily).toEqual({ "2026-10-01": 60 });
    expect(useSyncStore.getState().key).toBe(key);
  });

  it("rejects a malformed or unknown key without changing this device's key", async () => {
    const cloud = createFakeSyncApi();
    const own = useSyncStore.getState().ensureKey();
    const { result } = renderHook(() => useSync(cloud.api));
    await act(async () => expect(await result.current.restore("not a key")).toEqual({ ok: false, error: "invalid-key" }));
    await act(async () => expect(await result.current.restore(generateKey())).toEqual({ ok: false, error: "not-found" }));
    expect(useSyncStore.getState().key).toBe(own);
  });

  it("deletes the cloud copy and keeps local data; restoring the deleted key then finds nothing", async () => {
    const cloud = createFakeSyncApi();
    listen("2026-10-01", 60);
    const { result } = renderHook(() => useSync(cloud.api));
    await act(async () => void (await result.current.sync()));
    const key = useSyncStore.getState().key!;
    await act(async () => expect(await result.current.deleteCloud()).toEqual({ ok: true }));
    expect(cloud.records.size).toBe(0);
    expect(useStatsStore.getState().daily).toEqual({ "2026-10-01": 60 });
    expect(useSyncStore.getState().lastSyncedAt).toBeNull();
    await act(async () => expect(await result.current.restore(key)).toEqual({ ok: false, error: "not-found" }));
  });
});
