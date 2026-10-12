import { useBookmarkStore } from "@/stores/bookmark-store";
import { useLibraryStore } from "@/stores/library-store";
import { useProgressStore } from "@/stores/progress-store";
import { useSessionStore } from "@/stores/session-store";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore } from "@/stores/zikir-store";
import { syncWindow, unionSessions } from "./merge";
import type { SyncSnapshot } from "./types";

export function readLocalSnapshot(): SyncSnapshot {
  const { favoriteReciters, favoriteSurahs, playlists, history, marks } = useLibraryStore.getState();
  const { totalSeconds, daily, reciters, completed } = useStatsStore.getState();
  const { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt, plan } = useProgressStore.getState();
  const zikir = useZikirStore.getState();
  return {
    library: { favoriteReciters, favoriteSurahs, playlists, history, marks },
    stats: { totalSeconds, daily, reciters, completed },
    progress: { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt, ...(plan ? { plan } : {}) },
    zikir: { items: zikir.items, groups: zikir.groups, counts: zikir.counts, history: zikir.history, builtIns: zikir.builtIns },
    sessions: syncWindow(unionSessions(useSessionStore.getState().sessions, [])),
    bookmarks: useBookmarkStore.getState().bookmarks,
  };
}

export function writeLocalSnapshot(snapshot: SyncSnapshot) {
  useLibraryStore.setState(snapshot.library);
  useStatsStore.setState(snapshot.stats);
  useProgressStore.getState().restore(snapshot.progress);
  useZikirStore.getState().restore(snapshot.zikir, { keepRuns: true });
  // The snapshot only carries the recent log, so it is added to what this device has rather than replacing it.
  if (snapshot.bookmarks) useBookmarkStore.getState().restore(snapshot.bookmarks);
  if (snapshot.sessions) useSessionStore.getState().restore(unionSessions(useSessionStore.getState().sessions, snapshot.sessions));
}
