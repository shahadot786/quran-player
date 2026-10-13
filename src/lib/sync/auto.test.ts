import { describe, expect, it } from "vitest";
import { shouldAutoSync, type AutoSyncInput } from "./auto";

const KEY = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";
const base: AutoSyncInput = { auto: true, key: KEY, lastSyncedAt: new Date(2026, 9, 12, 21).getTime(), now: new Date(2026, 9, 13, 8), online: true, running: false };

describe("shouldAutoSync", () => {
  it("runs on the first open of a new day", () => {
    expect(shouldAutoSync(base)).toBe(true);
  });

  it("is done for the day after any sync today", () => {
    expect(shouldAutoSync({ ...base, lastSyncedAt: new Date(2026, 9, 13, 0, 5).getTime() })).toBe(false);
    expect(shouldAutoSync({ ...base, now: new Date(2026, 9, 13, 23, 59) , lastSyncedAt: new Date(2026, 9, 13, 7).getTime() })).toBe(false);
  });

  it("starts again after midnight, counting the day by the clock on the device", () => {
    expect(shouldAutoSync({ ...base, lastSyncedAt: new Date(2026, 9, 13, 23, 59).getTime(), now: new Date(2026, 9, 14, 0, 1) })).toBe(true);
  });

  it("does nothing when it is off, there is no key, nothing was ever synced, the device is offline or a sync is running", () => {
    expect(shouldAutoSync({ ...base, auto: false })).toBe(false);
    expect(shouldAutoSync({ ...base, key: null })).toBe(false);
    expect(shouldAutoSync({ ...base, lastSyncedAt: null })).toBe(false);
    expect(shouldAutoSync({ ...base, online: false })).toBe(false);
    expect(shouldAutoSync({ ...base, running: true })).toBe(false);
  });
});
