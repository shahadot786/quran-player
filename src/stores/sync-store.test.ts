import { beforeEach, describe, expect, it } from "vitest";
import { useSyncStore } from "./sync-store";

const store = () => useSyncStore.getState();

beforeEach(() => useSyncStore.setState(useSyncStore.getInitialState(), true));

describe("sync store", () => {
  it("starts with automatic sync off", () => {
    expect(store().auto).toBe(false);
  });

  it("registers this device under its automatic name, or the one the person chose", () => {
    store().registerDevice("me", "Chrome · Android", 10);
    expect(store().devices.me).toEqual({ name: "Chrome · Android", syncedAt: 10, updatedAt: 10, removed: false });
    store().renameDevice("me", "Shahadot's phone", "Chrome · Android", 20);
    expect(store().devices.me).toMatchObject({ name: "Shahadot's phone", syncedAt: 10, updatedAt: 20 });
    store().registerDevice("me", "Chrome · Android", 30);
    expect(store().devices.me!.name).toBe("Shahadot's phone");
    store().renameDevice("me", null, "Chrome · Android", 40);
    expect(store().devices.me!.name).toBe("Chrome · Android");
    expect(store().deviceName).toBeNull();
  });

  it("marks another device as removed and keeps the entry as a marker", () => {
    store().setDevices({ tablet: { name: "Tablet", syncedAt: 1, updatedAt: 1, removed: false } });
    store().removeDevice("tablet", 9);
    expect(store().devices.tablet).toMatchObject({ removed: true, updatedAt: 9 });
    store().removeDevice("nobody", 10);
    expect(store().devices.nobody).toBeUndefined();
  });

  it("forgets an earlier failure once synced or switched on again", () => {
    store().noteAutoFailure("2026-10-13");
    store().markSynced(1);
    expect(store().autoFailedDay).toBeNull();
    store().noteAutoFailure("2026-10-13");
    store().setAuto(true);
    expect(store().autoFailedDay).toBeNull();
  });
});
