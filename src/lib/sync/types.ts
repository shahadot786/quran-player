import type { Bookmark } from "@/stores/bookmark-store";
import type { LibraryMark, useLibraryStore } from "@/stores/library-store";
import type { ProgressSnapshot } from "@/stores/progress-store";
import type { ListeningSession } from "@/stores/session-store";
import type { useStatsStore } from "@/stores/stats-store";
import type { ZikirSnapshot } from "@/stores/zikir-store";

export type LibraryData = Pick<ReturnType<typeof useLibraryStore.getState>, "favoriteReciters" | "favoriteSurahs" | "playlists" | "history"> & {
  /** Missing in copies made before removals were recorded. */
  marks?: Record<string, LibraryMark>;
};
export type StatsData = Pick<ReturnType<typeof useStatsStore.getState>, "totalSeconds" | "daily" | "reciters" | "completed">;

/** What the cloud keeps: the listening and zikir data, without queue, volume or other device settings. */
export type SyncSnapshot = {
  library: LibraryData;
  stats: StatsData;
  progress: ProgressSnapshot;
  zikir: ZikirSnapshot;
  /** The recent part of the listening log; copies saved before the log existed don't have it. */
  sessions?: ListeningSession[];
  bookmarks?: Record<string, Bookmark>;
};
