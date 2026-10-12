import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateKey, isValidKey } from "@/lib/sync/key";

type SyncState = {
  key: string | null;
  lastSyncedAt: number | null;
  /** When the Home reminder to sync was last waved away. */
  nudgeDismissedAt: number | null;
  ensureKey: () => string;
  setKey: (key: string) => void;
  markSynced: (at?: number) => void;
  clearSynced: () => void;
  dismissNudge: (at?: number) => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      key: null,
      lastSyncedAt: null,
      nudgeDismissedAt: null,
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
      dismissNudge: (at = Date.now()) => set({ nudgeDismissedAt: at }),
    }),
    { name: "qp-sync", skipHydration: true },
  ),
);
