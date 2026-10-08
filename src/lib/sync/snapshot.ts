import { isLibrary, isProgress, isRecord, isStats, isZikir } from "@/lib/backup-guards";
import type { SyncSnapshot } from "./types";

export function isSyncSnapshot(value: unknown): value is SyncSnapshot {
  return isRecord(value) && isLibrary(value.library) && isStats(value.stats) && isProgress(value.progress) && isZikir(value.zikir);
}

