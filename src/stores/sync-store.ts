import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateKey, isValidKey } from "@/lib/sync/key";

type SyncState = {
  key: string | null;
  lastSyncedAt: number | null;
  ensureKey: () => string;
  setKey: (key: string) => void;
  markSynced: (at?: number) => void;
  clearSynced: () => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      key: null,
      lastSyncedAt: null,
      ensureKey: () => {
        const existing = get().key;
        if (existing && isValidKey(existing)) return existing;
        const key = generateKey();
        set({ key });
        return key;
      },
      setKey: (key) => set({ key, lastSyncedAt: null }),
      markSynced: (at = Date.now()) => set({ lastSyncedAt: at }),
      clearSynced: () => set({ lastSyncedAt: null }),
    }),
    { name: "qp-sync", skipHydration: true },
  ),
);
