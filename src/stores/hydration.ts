"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useLibraryStore } from "./library-store";
import { usePlayerStore } from "./player-store";
import { useSettingsStore } from "./settings-store";
import { useStatsStore } from "./stats-store";

export const PERSISTED_STORES = [useSettingsStore, usePlayerStore, useLibraryStore, useStatsStore] as const;

export const useHydrated = create<boolean>(() => false);

export function useRehydrateStores() {
  useEffect(() => {
    Promise.all(PERSISTED_STORES.map((store) => store.persist.rehydrate())).then(() => useHydrated.setState(true));
  }, []);
}
