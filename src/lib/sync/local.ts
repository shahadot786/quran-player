import { useLibraryStore } from "@/stores/library-store";
import { useProgressStore } from "@/stores/progress-store";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore } from "@/stores/zikir-store";
import type { SyncSnapshot } from "./types";

export function readLocalSnapshot(): SyncSnapshot {
  const { favoriteReciters, favoriteSurahs, playlists, history } = useLibraryStore.getState();
  const { totalSeconds, daily, reciters, completed } = useStatsStore.getState();
  const { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt } = useProgressStore.getState();
  const zikir = useZikirStore.getState();
  return {
    library: { favoriteReciters, favoriteSurahs, playlists, history },
    stats: { totalSeconds, daily, reciters, completed },
    progress: { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt },
    zikir: { items: zikir.items, groups: zikir.groups, counts: zikir.counts, history: zikir.history, builtIns: zikir.builtIns },
  };
}

export function writeLocalSnapshot(snapshot: SyncSnapshot) {
  useLibraryStore.setState(snapshot.library);
  useStatsStore.setState(snapshot.stats);
  useProgressStore.getState().restore(snapshot.progress);
  useZikirStore.getState().restore(snapshot.zikir, { keepRuns: true });
}
