"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useLibraryStore } from "./library-store";
import { usePlayerStore } from "./player-store";
import { useProgressStore } from "./progress-store";
import { useSettingsStore } from "./settings-store";
import { useStatsStore } from "./stats-store";

export const PERSISTED_STORES = [useSettingsStore, usePlayerStore, useLibraryStore, useStatsStore, useProgressStore] as const;

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
      useHydrated.setState(true);
    });
  }, []);
}
