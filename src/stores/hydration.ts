"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useBookmarkStore } from "./bookmark-store";
import { useLibraryStore } from "./library-store";
import { usePlayerStore } from "./player-store";
import { useProgressStore } from "./progress-store";
import { useReminderStore } from "./reminder-store";
import { useSessionStore } from "./session-store";
import { useSettingsStore } from "./settings-store";
import { useStatsStore } from "./stats-store";
import { useSyncStore } from "./sync-store";
import { useZikirStore } from "./zikir-store";

export const PERSISTED_STORES = [useSettingsStore, usePlayerStore, useLibraryStore, useStatsStore, useProgressStore, useZikirStore, useSyncStore, useSessionStore, useBookmarkStore, useReminderStore] as const;

export const useHydrated = create<boolean>(() => false);

// Reads what earlier versions saved so listening history carries over; the old stores are only read, never written.
export function importLegacyProgress() {
  useProgressStore.getState().importLegacy({
    completed: useStatsStore.getState().completed,
    reciters: useStatsStore.getState().reciters,
    positions: usePlayerStore.getState().positions,
    history: useLibraryStore.getState().history,
  });
}

export function useRehydrateStores() {
  useEffect(() => {
    Promise.all(PERSISTED_STORES.map((store) => store.persist.rehydrate())).then(() => {
      importLegacyProgress();
      useSyncStore.getState().ensureKey();
      useHydrated.setState(true);
    });
  }, []);
}
