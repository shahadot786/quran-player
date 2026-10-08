"use client";

import { useState } from "react";
import { cleanKey, isValidKey } from "@/lib/sync/key";
import { httpApi, runSync, SyncError, type SyncApi, type SyncErrorCode } from "@/lib/sync/client";
import { readLocalSnapshot, writeLocalSnapshot } from "@/lib/sync/local";
import { useSyncStore } from "@/stores/sync-store";

export type SyncTask = "sync" | "restore" | "delete";
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
      perform("sync", async () => {
        await runSync({ api, key: useSyncStore.getState().ensureKey(), local });
        useSyncStore.getState().markSynced();
      }),
    restore: (text: string) =>
      perform("restore", async () => {
        const key = cleanKey(text);
        if (!isValidKey(key)) throw new SyncError("invalid-key");
        await runSync({ api, key, local, requireRemote: true });
        useSyncStore.getState().setKey(key);
        useSyncStore.getState().markSynced();
      }),
    deleteCloud: () =>
      perform("delete", async () => {
        await api.remove(useSyncStore.getState().ensureKey());
        useSyncStore.getState().clearSynced();
      }),
  };
}
