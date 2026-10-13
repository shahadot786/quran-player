"use client";

import { useState } from "react";
import { cleanKey, isValidKey } from "@/lib/sync/key";
import { httpApi, runSync, SyncError, type SyncApi, type SyncErrorCode } from "@/lib/sync/client";
import { readLocalSnapshot, writeLocalSnapshot } from "@/lib/sync/local";
import { changeCode, registerThisDevice, syncNow } from "@/lib/sync/perform";
import { useSyncStore } from "@/stores/sync-store";

export type SyncTask = "sync" | "restore" | "delete" | "change";
export type SyncResult = { ok: true } | { ok: false; error: SyncErrorCode };

const local = { read: readLocalSnapshot, write: writeLocalSnapshot };

export function useSync(api: SyncApi = httpApi) {
  const [busy, setBusy] = useState<SyncTask | null>(null);

  const perform = async (task: SyncTask, work: () => Promise<void>): Promise<SyncResult> => {
    if (busy) return { ok: false, error: "conflict" };
    setBusy(task);
    try {
      await work();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof SyncError ? error.code : "server" };
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    sync: () =>
      perform("sync", () => syncNow(api)),
    restore: (text: string) =>
      perform("restore", async () => {
        const key = cleanKey(text);
        if (!isValidKey(key)) throw new SyncError("invalid-key");
        // The devices of the key being left don't belong to the new one; they come back if the restore fails.
        const previous = useSyncStore.getState().devices;
        useSyncStore.getState().setDevices({});
        registerThisDevice();
        try {
          await runSync({ api, key, local, requireRemote: true });
        } catch (error) {
          useSyncStore.getState().setDevices(previous);
          throw error;
        }
        useSyncStore.getState().setKey(key);
        useSyncStore.getState().markSynced();
      }),
    change: (text: string) => perform("change", () => changeCode(cleanKey(text), api)),
    deleteCloud: () =>
      perform("delete", async () => {
        await api.remove(useSyncStore.getState().ensureKey());
        const store = useSyncStore.getState();
        store.clearSynced();
        // The cloud copy is gone, so nothing may upload the data again on its own.
        store.setAuto(false);
        store.setDevices({});
      }),
  };
}
