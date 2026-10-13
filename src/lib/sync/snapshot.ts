import { isBookmarks, isDevices, isLibrary, isProgress, isRecord, isSessions, isStats, isZikir } from "@/lib/backup-guards";
import { SYNC_SESSION_LIMIT } from "./limits";
import type { SyncSnapshot } from "./types";

export function isSyncSnapshot(value: unknown): value is SyncSnapshot {
  return (
    isRecord(value) &&
    isLibrary(value.library) &&
    isStats(value.stats) &&
    isProgress(value.progress) &&
    isZikir(value.zikir) &&
    (value.sessions === undefined || (isSessions(value.sessions) && value.sessions.length <= SYNC_SESSION_LIMIT)) &&
    (value.bookmarks === undefined || isBookmarks(value.bookmarks)) &&
    (value.devices === undefined || isDevices(value.devices))
  );
}

