import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateKey, isValidKey } from "@/lib/sync/key";
import type { DeviceEntry } from "@/lib/sync/types";

type SyncState = {
  key: string | null;
  lastSyncedAt: number | null;
  /** When the Home reminder to sync was last waved away. */
  nudgeDismissedAt: number | null;
  /** Sync once a day, the first time the app is opened. Off until the person turns it on. */
  auto: boolean;
  /** The day an automatic sync last failed and said so, so a day with no connection brings one notice. */
  autoFailedDay: string | null;
  /** A name the person gave this device; null means the one made from the browser. */
  deviceName: string | null;
  /** Every device that has synced with this key, as the cloud copy last told us. */
  devices: Record<string, DeviceEntry>;
  ensureKey: () => string;
  setKey: (key: string) => void;
  markSynced: (at?: number) => void;
  clearSynced: () => void;
  dismissNudge: (at?: number) => void;
  setAuto: (on: boolean) => void;
  noteAutoFailure: (day: string) => void;
  setDevices: (devices: Record<string, DeviceEntry>) => void;
  registerDevice: (id: string, label: string, now?: number) => void;
  renameDevice: (id: string, name: string | null, label: string, now?: number) => void;
  removeDevice: (id: string, now?: number) => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      key: null,
      lastSyncedAt: null,
      nudgeDismissedAt: null,
      auto: false,
      autoFailedDay: null,
      deviceName: null,
      devices: {},
      ensureKey: () => {
        const existing = get().key;
        if (existing && isValidKey(existing)) return existing;
        const key = generateKey();
        set({ key });
        return key;
      },
      setKey: (key) => set({ key, lastSyncedAt: null }),
      markSynced: (at = Date.now()) => set({ lastSyncedAt: at, autoFailedDay: null }),
      clearSynced: () => set({ lastSyncedAt: null }),
      dismissNudge: (at = Date.now()) => set({ nudgeDismissedAt: at }),
      setAuto: (auto) => set({ auto, autoFailedDay: null }),
      noteAutoFailure: (day) => set({ autoFailedDay: day }),
      setDevices: (devices) => set({ devices }),
      registerDevice: (id, label, now = Date.now()) =>
        set((state) => ({ devices: { ...state.devices, [id]: { name: state.deviceName ?? label, syncedAt: now, updatedAt: now, removed: false } } })),
      renameDevice: (id, name, label, now = Date.now()) =>
        set((state) => {
          const current = state.devices[id];
          return {
            deviceName: name,
            devices: { ...state.devices, [id]: { name: name ?? label, syncedAt: current?.syncedAt ?? now, updatedAt: now, removed: false } },
          };
        }),
      removeDevice: (id, now = Date.now()) =>
        set((state) => {
          const current = state.devices[id];
          return current ? { devices: { ...state.devices, [id]: { ...current, removed: true, updatedAt: now } } } : state;
        }),
    }),
    { name: "qp-sync", skipHydration: true },
  ),
);
