import { localDateKey } from "@/lib/format";

export type AutoSyncInput = {
  auto: boolean;
  key: string | null;
  lastSyncedAt: number | null;
  now: Date;
  online: boolean;
  running: boolean;
};

/** Auto sync runs once a day: any sync today, by hand or automatic, means it is done for the day. */
export function shouldAutoSync({ auto, key, lastSyncedAt, now, online, running }: AutoSyncInput): boolean {
  if (!auto || !key || lastSyncedAt === null || !online || running) return false;
  return localDateKey(new Date(lastSyncedAt)) !== localDateKey(now);
}
