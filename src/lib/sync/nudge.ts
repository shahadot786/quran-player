const DAY_MS = 24 * 60 * 60 * 1000;
export const NUDGE_AFTER_DAYS = 7;
const NEVER_SYNCED_ACTIVE_DAYS = 3;
const QUIET_DAYS = 14;

export type Nudge = { kind: "never" } | { kind: "stale"; days: number } | null;

/** Whether Home should suggest a sync: when a week has passed since the last one, or when there is something worth keeping and it was never synced. */
export function syncNudge(input: { now: number; lastSyncedAt: number | null; dismissedAt: number | null; activeDays: number }): Nudge {
  const { now, lastSyncedAt, dismissedAt, activeDays } = input;
  if (dismissedAt !== null && now - dismissedAt < QUIET_DAYS * DAY_MS) return null;
  if (lastSyncedAt === null) return activeDays >= NEVER_SYNCED_ACTIVE_DAYS ? { kind: "never" } : null;
  const days = Math.floor((now - lastSyncedAt) / DAY_MS);
  return days >= NUDGE_AFTER_DAYS ? { kind: "stale", days } : null;
}
