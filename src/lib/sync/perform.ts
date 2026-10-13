import { getDeviceId } from "@/lib/device";
import { useSyncStore } from "@/stores/sync-store";
import { httpApi, runSync, SyncError, type SyncApi } from "./client";
import { isValidKey } from "./key";
import { describeDevice } from "./device-label";
import { readLocalSnapshot, writeLocalSnapshot } from "./local";

const local = { read: readLocalSnapshot, write: writeLocalSnapshot };

/** Puts this device, under its current name and the time, into the data about to be synced. */
export function registerThisDevice(now = Date.now()) {
  useSyncStore.getState().registerDevice(getDeviceId(), describeDevice(typeof navigator === "undefined" ? "" : navigator.userAgent), now);
}

let running: Promise<void> | null = null;

export const isSyncing = () => running !== null;

/**
 * Moves the cloud copy to a new code: the new code must not be in use, the data is uploaded under it, and only then is the old copy removed.
 * If anything fails before that, the old code, its devices and its cloud copy are left as they were.
 */
export async function changeCode(newKey: string, api: SyncApi = httpApi): Promise<void> {
  await running?.catch(() => undefined);
  const before = useSyncStore.getState();
  const old = before.key;
  if (!isValidKey(newKey)) throw new SyncError("invalid-key");
  if (newKey === old) return;
  if (await api.get(newKey)) throw new SyncError("code-taken");

  const hadCopy = before.lastSyncedAt !== null;
  const devices = before.devices;
  useSyncStore.getState().setDevices({});
  registerThisDevice();
  try {
    await runSync({ api, key: newKey, local });
  } catch (error) {
    useSyncStore.getState().setDevices(devices);
    throw error;
  }
  useSyncStore.getState().setKey(newKey);
  useSyncStore.getState().markSynced();
  // The old copy is only tidied away; if that fails it is simply left to expire.
  if (old && hadCopy) await api.remove(old).catch(() => undefined);
}

/** The one way to sync: a second call while one is running waits for that one, so the button and the daily sync can't collide. */
export function syncNow(api: SyncApi = httpApi): Promise<void> {
  running ??= (async () => {
    const key = useSyncStore.getState().ensureKey();
    registerThisDevice();
    await runSync({ api, key, local });
    useSyncStore.getState().markSynced();
  })().finally(() => {
    running = null;
  });
  return running;
}
