import { describe, expect, it } from "vitest";
import { syncNudge } from "./nudge";

const DAY = 24 * 60 * 60 * 1000;
const now = 100 * DAY;

describe("syncNudge", () => {
  it("stays quiet within a week of the last sync and speaks up after", () => {
    expect(syncNudge({ now, lastSyncedAt: now - 6 * DAY, dismissedAt: null, activeDays: 30 })).toBeNull();
    expect(syncNudge({ now, lastSyncedAt: now - 9 * DAY, dismissedAt: null, activeDays: 30 })).toEqual({ kind: "stale", days: 9 });
  });

  it("suggests a first sync only once there are a few days worth keeping", () => {
    expect(syncNudge({ now, lastSyncedAt: null, dismissedAt: null, activeDays: 2 })).toBeNull();
    expect(syncNudge({ now, lastSyncedAt: null, dismissedAt: null, activeDays: 3 })).toEqual({ kind: "never" });
  });

  it("goes away for two weeks when waved away", () => {
    expect(syncNudge({ now, lastSyncedAt: null, dismissedAt: now - 13 * DAY, activeDays: 30 })).toBeNull();
    expect(syncNudge({ now, lastSyncedAt: null, dismissedAt: now - 15 * DAY, activeDays: 30 })).toEqual({ kind: "never" });
  });
});
