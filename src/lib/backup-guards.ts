import type { LibraryData, StatsData } from "./sync/types";
import type { ProgressSnapshot } from "@/stores/progress-store";
import { NOTE_LIMIT, bookmarkKey, type Bookmark } from "@/stores/bookmark-store";
import type { ListeningSession } from "@/stores/session-store";
import type { DeviceEntry } from "./sync/types";
import type { ZikirSnapshot } from "@/stores/zikir-store";
import { decodeSlices } from "./progress/slices";
import type { Track } from "./types";

const SURAH_COUNT = 114;

export type Guard<T> = (value: unknown) => value is T;

export const isRecord: Guard<Record<string, unknown>> = (value): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export const isNumber: Guard<number> = (value): value is number => typeof value === "number" && Number.isFinite(value);
export const isString: Guard<string> = (value): value is string => typeof value === "string";
export const isBoolean: Guard<boolean> = (value): value is boolean => typeof value === "boolean";
export const isSurah: Guard<number> = (value): value is number => isNumber(value) && Number.isInteger(value) && value >= 1 && value <= SURAH_COUNT;
export const arrayOf =
  <T>(guard: Guard<T>): Guard<T[]> =>
  (value): value is T[] =>
    Array.isArray(value) && value.every(guard);
export const recordOf =
  <T>(guard: Guard<T>): Guard<Record<string, T>> =>
  (value): value is Record<string, T> =>
    isRecord(value) && Object.values(value).every(guard);

export const isTrack: Guard<Track> = (value): value is Track =>
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

const isPlaylist = (value: unknown): value is LibraryData["playlists"][number] =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  arrayOf(isTrack)(value.tracks) &&
  isNumber(value.createdAt) &&
  isNumber(value.updatedAt);

export const isLibrary: Guard<LibraryData> = (value): value is LibraryData =>
  isRecord(value) &&
  arrayOf((r): r is LibraryData["favoriteReciters"][number] => isRecord(r) && isNumber(r.id) && isString(r.name))(value.favoriteReciters) &&
  arrayOf(isSurah)(value.favoriteSurahs) &&
  arrayOf(isPlaylist)(value.playlists) &&
  arrayOf((h): h is LibraryData["history"][number] => isRecord(h) && isTrack(h.track) && isNumber(h.playedAt))(value.history) &&
  (value.marks === undefined || recordOf((m): m is { on: boolean; at: number } => isRecord(m) && isBoolean(m.on) && isNumber(m.at))(value.marks));

export const isStats: Guard<StatsData> = (value): value is StatsData =>
  isRecord(value) &&
  isNumber(value.totalSeconds) &&
  recordOf(isNumber)(value.daily) &&
  recordOf((r): r is StatsData["reciters"][number] => isRecord(r) && isString(r.name) && isNumber(r.seconds))(value.reciters) &&
  recordOf(
    (c): c is StatsData["completed"][string] =>
      isRecord(c) && isSurah(c.surah) && isNumber(c.reciterId) && isNumber(c.count) && isNumber(c.lastAt),
  )(value.completed);

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
export const isNonNegative: Guard<number> = (value): value is number => isNumber(value) && value >= 0;
export const isCount: Guard<number> = (value): value is number => isNonNegative(value) && Number.isInteger(value);
export const isNullableTime = (value: unknown): value is number | null => value === null || isNumber(value);
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

export const isProgress: Guard<ProgressSnapshot> = (value): value is ProgressSnapshot =>
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
  isNullableTime(value.legacyImportedAt) &&
  (value.plan === undefined ||
    (isRecord(value.plan) && (value.plan.finishBy === null || (isString(value.plan.finishBy) && DAY_KEY.test(value.plan.finishBy))) && isNumber(value.plan.updatedAt)));

const isPositiveCount: Guard<number> = (value): value is number => isCount(value) && value >= 1;
const isOptionalCount = (value: unknown): value is number | null => value === null || isPositiveCount(value);

const isZikirItem = (value: unknown): value is ZikirSnapshot["items"][number] =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.arabic) &&
  isString(value.transliteration) &&
  isString(value.meaning) &&
  isOptionalCount(value.target) &&
  isOptionalCount(value.dailyGoal) &&
  isNumber(value.createdAt) &&
  isNumber(value.updatedAt) &&
  isNullableTime(value.deletedAt);

const isZikirGroup = (value: unknown): value is ZikirSnapshot["groups"][number] =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  arrayOf((step): step is { itemId: string; target: number } => isRecord(step) && isString(step.itemId) && isPositiveCount(step.target))(value.steps) &&
  isOptionalCount(value.dailyGoal) &&
  isNumber(value.createdAt) &&
  isNumber(value.updatedAt) &&
  isNullableTime(value.deletedAt);

const isDeviceCell = (value: unknown): boolean => isRecord(value) && isCount(value.n) && isNumber(value.at);
const isZikirCounts = (value: unknown): value is ZikirSnapshot["counts"] =>
  isRecord(value) &&
  Object.entries(value).every(
    ([day, items]) => DAY_KEY.test(day) && isRecord(items) && Object.values(items).every((cells) => isRecord(cells) && Object.values(cells).every(isDeviceCell)),
  );

const isZikirHistory = (value: unknown): value is ZikirSnapshot["history"][number] =>
  isRecord(value) &&
  isString(value.id) &&
  (value.kind === "item" || value.kind === "group") &&
  isString(value.refId) &&
  (value.name === null || isString(value.name)) &&
  isCount(value.count) &&
  isNumber(value.finishedAt) &&
  isBoolean(value.completed);

export const isZikir: Guard<ZikirSnapshot> = (value): value is ZikirSnapshot =>
  isRecord(value) &&
  arrayOf(isZikirItem)(value.items) &&
  arrayOf(isZikirGroup)(value.groups) &&
  isZikirCounts(value.counts) &&
  arrayOf(isZikirHistory)(value.history) &&
  recordOf((entry): entry is { removed: boolean; at: number } => isRecord(entry) && isBoolean(entry.removed) && isNumber(entry.at))(value.builtIns);


export const isSessions: Guard<ListeningSession[]> = arrayOf(
  (value): value is ListeningSession =>
    isRecord(value) &&
    isString(value.id) &&
    isString(value.day) &&
    DAY_KEY.test(value.day) &&
    isNumber(value.startedAt) &&
    isNumber(value.updatedAt) &&
    isSurah(value.surah) &&
    isNumber(value.reciterId) &&
    isString(value.reciterName) &&
    isNumber(value.moshafId) &&
    isNonNegative(value.seconds),
);

export const isBookmarks: Guard<Record<string, Bookmark>> = (value): value is Record<string, Bookmark> =>
  isRecord(value) &&
  Object.entries(value).every(
    ([key, bookmark]) =>
      isRecord(bookmark) &&
      isSurah(bookmark.surah) &&
      isCount(bookmark.ayah) &&
      bookmark.ayah >= 1 &&
      key === bookmarkKey(bookmark.surah, bookmark.ayah) &&
      isString(bookmark.note) &&
      bookmark.note.length <= NOTE_LIMIT &&
      isNumber(bookmark.createdAt) &&
      isNumber(bookmark.updatedAt) &&
      isNullableTime(bookmark.deletedAt),
  );

export const MAX_DEVICES = 30;
export const isDevices: Guard<Record<string, DeviceEntry>> = (value): value is Record<string, DeviceEntry> =>
  isRecord(value) &&
  Object.keys(value).length <= MAX_DEVICES &&
  Object.entries(value).every(
    ([id, device]) =>
      id.length >= 1 &&
      id.length <= 100 &&
      isRecord(device) &&
      isString(device.name) &&
      device.name.length <= 80 &&
      isNumber(device.syncedAt) &&
      isNumber(device.updatedAt) &&
      isBoolean(device.removed),
  );
