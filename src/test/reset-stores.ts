import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { useProgressStore } from "@/stores/progress-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore } from "@/stores/zikir-store";

export function resetStores() {
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useLibraryStore.setState(useLibraryStore.getInitialState(), true);
  useStatsStore.setState(useStatsStore.getInitialState(), true);
  useProgressStore.setState(useProgressStore.getInitialState(), true);
  useZikirStore.setState(useZikirStore.getInitialState(), true);
}
