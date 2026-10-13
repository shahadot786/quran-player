import { beforeEach, describe, expect, it } from "vitest";
import { getDeviceId } from "@/lib/device";
import { useStatsStore } from "@/stores/stats-store";
import { useSyncStore } from "@/stores/sync-store";
import { createFakeSyncApi } from "@/test/fake-sync-api";
import { resetStores } from "@/test/reset-stores";
import { SyncError } from "./client";
import { changeCode, isSyncing, syncNow } from "./perform";

beforeEach(() => resetStores());

describe("syncNow", () => {
  it("adds this device to the cloud copy under its automatic name, and marks the time", async () => {
    const cloud = createFakeSyncApi();
    await syncNow(cloud.api);
    const key = useSyncStore.getState().key!;
    const devices = cloud.records.get(key)!.snapshot.devices!;
    expect(Object.keys(devices)).toEqual([getDeviceId()]);
    expect(devices[getDeviceId()]).toMatchObject({ removed: false });
    expect(devices[getDeviceId()]!.name).toMatch(/\S/);
    expect(useSyncStore.getState().lastSyncedAt).not.toBeNull();
  });

  it("uses the name the person gave this device", async () => {
    const cloud = createFakeSyncApi();
    useSyncStore.setState({ deviceName: "Shahadot's phone" });
    await syncNow(cloud.api);
    expect(cloud.records.get(useSyncStore.getState().key!)!.snapshot.devices![getDeviceId()]!.name).toBe("Shahadot's phone");
  });

  it("shares one request between two callers started together", async () => {
    const cloud = createFakeSyncApi();
    const first = syncNow(cloud.api);
    expect(isSyncing()).toBe(true);
    const second = syncNow(cloud.api);
    expect(second).toBe(first);
    await Promise.all([first, second]);
    expect(cloud.calls.put).toBe(1);
    expect(isSyncing()).toBe(false);
  });

  it("can sync again after a failure, and leaves the last sync time as it was", async () => {
    const cloud = createFakeSyncApi();
    cloud.failNext(new SyncError("offline"));
    await expect(syncNow(cloud.api)).rejects.toMatchObject({ code: "offline" });
    expect(isSyncing()).toBe(false);
    expect(useSyncStore.getState().lastSyncedAt).toBeNull();
    await syncNow(cloud.api);
    expect(useSyncStore.getState().lastSyncedAt).not.toBeNull();
  });

  it("brings the other devices of the cloud copy onto this one", async () => {
    const cloud = createFakeSyncApi();
    useStatsStore.setState({ daily: { "2026-10-01": 60 }, totalSeconds: 60 });
    await syncNow(cloud.api);
    const key = useSyncStore.getState().key!;
    const record = cloud.records.get(key)!;
    record.snapshot.devices = { ...record.snapshot.devices, laptop: { name: "Edge · Windows", syncedAt: 5, updatedAt: 5, removed: false } };
    record.version += 1;
    await syncNow(cloud.api);
    expect(Object.keys(useSyncStore.getState().devices).sort()).toEqual([getDeviceId(), "laptop"].sort());
  });
});

describe("changeCode", () => {
  const OLD = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";
  const NEW = "lunar-pizza-tiger-cabin-42";

  async function synced() {
    const cloud = createFakeSyncApi();
    useStatsStore.setState({ daily: { "2026-10-01": 60 }, totalSeconds: 60 });
    useSyncStore.setState({ key: OLD });
    await syncNow(cloud.api);
    return cloud;
  }

  it("moves the cloud copy to the new code and removes the old one", async () => {
    const cloud = await synced();
    expect([...cloud.records.keys()]).toEqual([OLD]);
    await changeCode(NEW, cloud.api);
    expect([...cloud.records.keys()]).toEqual([NEW]);
    expect(cloud.records.get(NEW)!.snapshot.stats.daily).toEqual({ "2026-10-01": 60 });
    expect(useSyncStore.getState().key).toBe(NEW);
    expect(useSyncStore.getState().lastSyncedAt).not.toBeNull();
    expect(Object.keys(useSyncStore.getState().devices)).toEqual([getDeviceId()]);
  });

  it("only sets the new code when nothing was ever uploaded", async () => {
    const cloud = createFakeSyncApi();
    useSyncStore.setState({ key: OLD });
    await changeCode(NEW, cloud.api);
    expect(useSyncStore.getState().key).toBe(NEW);
    expect(cloud.calls.remove).toBe(0);
  });

  it("refuses a code that someone already uses, and changes nothing", async () => {
    const cloud = await synced();
    cloud.records.set(NEW, { version: 3, snapshot: cloud.records.get(OLD)!.snapshot });
    await expect(changeCode(NEW, cloud.api)).rejects.toMatchObject({ code: "code-taken" });
    expect(useSyncStore.getState().key).toBe(OLD);
    expect(cloud.records.has(OLD)).toBe(true);
    expect(cloud.records.get(NEW)!.version).toBe(3);
  });

  it("refuses a code that is too easy to guess", async () => {
    const cloud = await synced();
    await expect(changeCode("my-dog-rex", cloud.api)).rejects.toMatchObject({ code: "invalid-key" });
    expect(useSyncStore.getState().key).toBe(OLD);
  });

  it("keeps the old code, its copy and its devices when the upload fails", async () => {
    const cloud = await synced();
    const devices = useSyncStore.getState().devices;
    const failing = { ...cloud.api, put: async () => Promise.reject(new SyncError("server")) };
    await expect(changeCode(NEW, failing)).rejects.toMatchObject({ code: "server" });
    expect(useSyncStore.getState().key).toBe(OLD);
    expect(useSyncStore.getState().devices).toEqual(devices);
    expect(cloud.records.has(OLD)).toBe(true);
    expect(cloud.records.has(NEW)).toBe(false);
  });

  it("does nothing for the code already in use", async () => {
    const cloud = await synced();
    const calls = { ...cloud.calls };
    await changeCode(OLD, cloud.api);
    expect(cloud.calls).toEqual(calls);
  });
});

