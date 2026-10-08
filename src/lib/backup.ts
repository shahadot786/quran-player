import { PLAYBACK_RATES, useSettingsStore, type RepeatMode } from "@/stores/settings-store";
import { importLegacyProgress } from "@/stores/hydration";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore, type PlayerSnapshot } from "@/stores/player-store";
import { useProgressStore, type ProgressSnapshot } from "@/stores/progress-store";
import { useStatsStore } from "@/stores/stats-store";
import { localDateKey } from "./format";
import { decodeSlices } from "./progress/slices";
import type { Track } from "./types";

const BACKUP_APP = "tilawah";
const BACKUP_VERSION = 1;
const SURAH_COUNT = 114;
const REPEAT_MODES: RepeatMode[] = ["off", "one", "all"];

export class InvalidBackupError extends Error {
  constructor() {
    super("Not a Tilawah backup");
  }
}

type SettingsData = { volume: number; muted: boolean; rate: number; repeat: RepeatMode; autoNext: boolean };
type LibraryData = Pick<ReturnType<typeof useLibraryStore.getState>, "favoriteReciters" | "favoriteSurahs" | "playlists" | "history">;
type StatsData = Pick<ReturnType<typeof useStatsStore.getState>, "totalSeconds" | "daily" | "reciters" | "completed">;

export type Backup = {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  // Backups made before progress existed don't have it, and restoring one rebuilds it from the rest.
  data: { settings: SettingsData; player: PlayerSnapshot; library: LibraryData; stats: StatsData; progress?: ProgressSnapshot };
};

type Guard<T> = (value: unknown) => value is T;

const isRecord: Guard<Record<string, unknown>> = (value): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNumber: Guard<number> = (value): value is number => typeof value === "number" && Number.isFinite(value);
const isString: Guard<string> = (value): value is string => typeof value === "string";
const isBoolean: Guard<boolean> = (value): value is boolean => typeof value === "boolean";
const isSurah: Guard<number> = (value): value is number => isNumber(value) && Number.isInteger(value) && value >= 1 && value <= SURAH_COUNT;
const arrayOf =
  <T>(guard: Guard<T>): Guard<T[]> =>
  (value): value is T[] =>
    Array.isArray(value) && value.every(guard);
const recordOf =
  <T>(guard: Guard<T>): Guard<Record<string, T>> =>
  (value): value is Record<string, T> =>
    isRecord(value) && Object.values(value).every(guard);

const isTrack: Guard<Track> = (value): value is Track =>
  isRecord(value) &&
  isNumber(value.reciterId) &&
  isString(value.reciterName) &&
  isNumber(value.moshafId) &&
  isString(value.moshafName) &&
  isString(value.server) &&
  value.server.startsWith("https://") &&
  isBoolean(value.padded) &&
  (value.downloadable === undefined || isBoolean(value.downloadable)) &&
  (value.synced === undefined || isBoolean(value.synced)) &&
  isSurah(value.surah);

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

const isPlaylist = (value: unknown): value is LibraryData["playlists"][number] =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  arrayOf(isTrack)(value.tracks) &&
  isNumber(value.createdAt) &&
  isNumber(value.updatedAt);

const isLibrary: Guard<LibraryData> = (value): value is LibraryData =>
  isRecord(value) &&
  arrayOf((r): r is LibraryData["favoriteReciters"][number] => isRecord(r) && isNumber(r.id) && isString(r.name))(value.favoriteReciters) &&
  arrayOf(isSurah)(value.favoriteSurahs) &&
  arrayOf(isPlaylist)(value.playlists) &&
  arrayOf((h): h is LibraryData["history"][number] => isRecord(h) && isTrack(h.track) && isNumber(h.playedAt))(value.history);

const isStats: Guard<StatsData> = (value): value is StatsData =>
  isRecord(value) &&
  isNumber(value.totalSeconds) &&
  recordOf(isNumber)(value.daily) &&
  recordOf((r): r is StatsData["reciters"][number] => isRecord(r) && isString(r.name) && isNumber(r.seconds))(value.reciters) &&
  recordOf(
    (c): c is StatsData["completed"][string] =>
      isRecord(c) && isSurah(c.surah) && isNumber(c.reciterId) && isNumber(c.count) && isNumber(c.lastAt),
  )(value.completed);

const isNonNegative: Guard<number> = (value): value is number => isNumber(value) && value >= 0;
const isCount: Guard<number> = (value): value is number => isNonNegative(value) && Number.isInteger(value);
const isNullableTime = (value: unknown): value is number | null => value === null || isNumber(value);
const hasSurahKeys = (value: Record<string, unknown>) => Object.keys(value).every((key) => isSurah(Number(key)));
const LEGACY_SOURCES = ["finished", "resume", "history"];

const isLifetime = (value: unknown): value is ProgressSnapshot["lifetime"][number] =>
  isRecord(value) &&
  isNonNegative(value.seconds) &&
  isCount(value.completions) &&
  isNullableTime(value.lastAt) &&
  (value.source === null || LEGACY_SOURCES.includes(value.source as string)) &&
  recordOf((r): r is { name: string; seconds: number } => isRecord(r) && isString(r.name) && isNonNegative(r.seconds))(value.reciters);

const isRound = (value: unknown): value is ProgressSnapshot["rounds"][number] =>
  isRecord(value) && isCount(value.number) && value.number >= 1 && isNumber(value.startedAt) && isNumber(value.finishedAt) && isNonNegative(value.seconds);

const isProgress: Guard<ProgressSnapshot> = (value): value is ProgressSnapshot =>
  isRecord(value) &&
  isRecord(value.slices) &&
  hasSurahKeys(value.slices) &&
  recordOf((text): text is string => isString(text) && decodeSlices(text) !== null)(value.slices) &&
  isRecord(value.lifetime) &&
  hasSurahKeys(value.lifetime) &&
  recordOf(isLifetime)(value.lifetime) &&
  arrayOf(isRound)(value.rounds) &&
  isCount(value.currentRound) &&
  value.currentRound >= 1 &&
  isNullableTime(value.roundStartedAt) &&
  isNonNegative(value.roundSeconds) &&
  isNonNegative(value.paceSeconds) &&
  isNonNegative(value.paceAyahs) &&
  isNullableTime(value.legacyImportedAt);

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
  const { settings, player, library, stats, progress } = parsed.data;
  if (!isSettings(settings) || !isPlayer(player) || !isLibrary(library) || !isStats(stats)) throw new InvalidBackupError();
  if (progress !== undefined && !isProgress(progress)) throw new InvalidBackupError();
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: parsed.exportedAt, data: { settings, player, library, stats, ...(progress ? { progress } : {}) } };
}

export function restoreBackup(backup: Backup) {
  const { settings, player, library, stats, progress } = backup.data;
  useSettingsStore.setState(settings);
  usePlayerStore.getState().restore(player);
  useLibraryStore.setState(library);
  useStatsStore.setState(stats);
  useProgressStore.getState().restore(progress ?? null);
  if (!progress) importLegacyProgress();
}

export function resetAllData() {
  usePlayerStore.getState().reset();
  useLibraryStore.getState().reset();
  useStatsStore.getState().reset();
  useProgressStore.getState().reset();
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
