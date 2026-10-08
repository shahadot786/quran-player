import { PLAYBACK_RATES, useSettingsStore, type RepeatMode } from "@/stores/settings-store";
import { importLegacyProgress } from "@/stores/hydration";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore, type PlayerSnapshot } from "@/stores/player-store";
import { useProgressStore, type ProgressSnapshot } from "@/stores/progress-store";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore, type ZikirSnapshot } from "@/stores/zikir-store";
import { arrayOf, isBoolean, isLibrary, isNumber, isProgress, isRecord, isStats, isString, isTrack, isZikir, recordOf, type Guard } from "./backup-guards";
import { localDateKey } from "./format";
import type { LibraryData, StatsData } from "./sync/types";

const BACKUP_APP = "tilawah";
const BACKUP_VERSION = 1;
const REPEAT_MODES: RepeatMode[] = ["off", "one", "all"];

export class InvalidBackupError extends Error {
  constructor() {
    super("Not a Tilawah backup");
  }
}

type SettingsData = { volume: number; muted: boolean; rate: number; repeat: RepeatMode; autoNext: boolean };

export type Backup = {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  // Backups made before progress existed don't have it, and restoring one rebuilds it from the rest.
  data: { settings: SettingsData; player: PlayerSnapshot; library: LibraryData; stats: StatsData; progress?: ProgressSnapshot; zikir?: ZikirSnapshot };
};

const isSettings: Guard<SettingsData> = (value): value is SettingsData =>
  isRecord(value) &&
  isNumber(value.volume) &&
  value.volume >= 0 &&
  value.volume <= 1 &&
  isBoolean(value.muted) &&
  isNumber(value.rate) &&
  (PLAYBACK_RATES as readonly number[]).includes(value.rate) &&
  REPEAT_MODES.includes(value.repeat as RepeatMode) &&
  isBoolean(value.autoNext);

const isPlayer: Guard<PlayerSnapshot> = (value): value is PlayerSnapshot =>
  isRecord(value) &&
  arrayOf(isTrack)(value.queue) &&
  isNumber(value.index) &&
  Number.isInteger(value.index) &&
  value.index >= 0 &&
  (value.queue.length === 0 ? value.index === 0 : value.index < value.queue.length) &&
  recordOf(
    (position): position is PlayerSnapshot["positions"][string] =>
      isRecord(position) && isNumber(position.time) && isNumber(position.duration) && isNumber(position.updatedAt) && isTrack(position.track),
  )(value.positions);

function zikirSnapshot(): ZikirSnapshot {
  const { items, groups, counts, history, builtIns } = useZikirStore.getState();
  return { items, groups, counts, history, builtIns };
}

function progressSnapshot(): ProgressSnapshot {
  const { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt } = useProgressStore.getState();
  return { slices, lifetime, rounds, currentRound, roundStartedAt, roundSeconds, paceSeconds, paceAyahs, legacyImportedAt };
}

export function createBackup(now = new Date()): Backup {
  const settings = useSettingsStore.getState();
  const player = usePlayerStore.getState();
  const library = useLibraryStore.getState();
  const stats = useStatsStore.getState();
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: {
      settings: { volume: settings.volume, muted: settings.muted, rate: settings.rate, repeat: settings.repeat, autoNext: settings.autoNext },
      player: { queue: player.queue, index: player.index, positions: player.positions },
      library: {
        favoriteReciters: library.favoriteReciters,
        favoriteSurahs: library.favoriteSurahs,
        playlists: library.playlists,
        history: library.history,
      },
      stats: { totalSeconds: stats.totalSeconds, daily: stats.daily, reciters: stats.reciters, completed: stats.completed },
      progress: progressSnapshot(),
      zikir: zikirSnapshot(),
    },
  };
}

export function parseBackup(text: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBackupError();
  }
  if (!isRecord(parsed) || parsed.app !== BACKUP_APP || parsed.version !== BACKUP_VERSION || !isString(parsed.exportedAt) || !isRecord(parsed.data)) {
    throw new InvalidBackupError();
  }
  const { settings, player, library, stats, progress, zikir } = parsed.data;
  if (!isSettings(settings) || !isPlayer(player) || !isLibrary(library) || !isStats(stats)) throw new InvalidBackupError();
  if (progress !== undefined && !isProgress(progress)) throw new InvalidBackupError();
  if (zikir !== undefined && !isZikir(zikir)) throw new InvalidBackupError();
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: parsed.exportedAt,
    data: { settings, player, library, stats, ...(progress ? { progress } : {}), ...(zikir ? { zikir } : {}) },
  };
}

export function restoreBackup(backup: Backup) {
  const { settings, player, library, stats, progress, zikir } = backup.data;
  useSettingsStore.setState(settings);
  usePlayerStore.getState().restore(player);
  useLibraryStore.setState(library);
  useStatsStore.setState(stats);
  useProgressStore.getState().restore(progress ?? null);
  if (!progress) importLegacyProgress();
  // A backup from before zikir existed has nothing to say about it, so what is on this device stays.
  if (zikir) useZikirStore.getState().restore(zikir);
}

export function resetAllData() {
  usePlayerStore.getState().reset();
  useLibraryStore.getState().reset();
  useStatsStore.getState().reset();
  useProgressStore.getState().reset();
  useZikirStore.getState().reset();
}

export function saveBackupFile(backup = createBackup()) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${BACKUP_APP}-backup-${localDateKey(new Date(backup.exportedAt))}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackupFile(file: File) {
  restoreBackup(parseBackup(await file.text()));
}
