import { trackKey } from "@/lib/audio-url";
import { decodeSlices, emptySlices, encodeSlices, unionSlices } from "@/lib/progress/slices";
import { HISTORY_LIMIT as PLAYS_LIMIT } from "@/stores/library-store";
import type { ProgressSnapshot, SurahLifetime } from "@/stores/progress-store";
import { HISTORY_LIMIT as ROUNDS_LIMIT, type ZikirSnapshot } from "@/stores/zikir-store";
import type { Counts } from "@/lib/zikir/types";
import type { LibraryData, StatsData, SyncSnapshot } from "./types";

// Every merger below gives the same result whatever order the two sides come in, so two devices end up identical.

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return `{${entries.sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

const bigger = (a: number, b: number) => (a > b ? a : b);
const biggerOrNull = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : bigger(a, b));
const smallerOrNull = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.min(a, b));

// The entry with the larger rank wins; a tie is settled by content so the choice never depends on the order.
function pick<T>(a: T, b: T, rank: (value: T) => number): T {
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra > rb ? a : b;
  return stableStringify(a) >= stableStringify(b) ? a : b;
}

function mergeKeyed<T>(a: Record<string, T>, b: Record<string, T>, combine: (x: T, y: T) => T): Record<string, T> {
  const result: Record<string, T> = { ...a };
  for (const [key, value] of Object.entries(b)) result[key] = key in a ? combine(a[key]!, value) : value;
  return result;
}

function unionBy<T>(a: T[], b: T[], key: (item: T) => string, combine: (x: T, y: T) => T): T[] {
  const map = new Map<string, T>();
  for (const item of [...a, ...b]) {
    const id = key(item);
    const known = map.get(id);
    map.set(id, known === undefined ? item : combine(known, item));
  }
  return [...map.values()];
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function mergeLibrary(a: LibraryData, b: LibraryData): LibraryData {
  const history = unionBy(a.history, b.history, (h) => trackKey(h.track), (x, y) => pick(x, y, (h) => h.playedAt))
    .sort((x, y) => y.playedAt - x.playedAt || byText(trackKey(x.track), trackKey(y.track)))
    .slice(0, PLAYS_LIMIT);
  return {
    favoriteReciters: unionBy(a.favoriteReciters, b.favoriteReciters, (r) => String(r.id), (x, y) => pick(x, y, () => 0)).sort((x, y) => x.id - y.id),
    favoriteSurahs: [...new Set([...a.favoriteSurahs, ...b.favoriteSurahs])].sort((x, y) => x - y),
    playlists: unionBy(a.playlists, b.playlists, (p) => p.id, (x, y) => pick(x, y, (p) => p.updatedAt)).sort(
      (x, y) => x.createdAt - y.createdAt || byText(x.id, y.id),
    ),
    history,
  };
}

function mergeStats(a: StatsData, b: StatsData): StatsData {
  const daily = mergeKeyed(a.daily, b.daily, bigger);
  const summed = Object.values(daily).reduce((total, seconds) => total + seconds, 0);
  return {
    totalSeconds: Math.max(a.totalSeconds, b.totalSeconds, summed),
    daily,
    reciters: mergeKeyed(a.reciters, b.reciters, (x, y) => pick(x, y, (r) => r.seconds)),
    completed: mergeKeyed(a.completed, b.completed, (x, y) => ({ ...pick(x, y, (c) => c.count), count: bigger(x.count, y.count), lastAt: bigger(x.lastAt, y.lastAt) })),
  };
}

const SOURCE_RANK = { finished: 3, resume: 2, history: 1 } as const;

function mergeLifetime(a: SurahLifetime, b: SurahLifetime): SurahLifetime {
  const rank = (source: SurahLifetime["source"]) => (source === null ? 0 : SOURCE_RANK[source]);
  return {
    seconds: bigger(a.seconds, b.seconds),
    completions: bigger(a.completions, b.completions),
    lastAt: biggerOrNull(a.lastAt, b.lastAt),
    reciters: mergeKeyed(a.reciters, b.reciters, (x, y) => pick(x, y, (r) => r.seconds)),
    source: rank(a.source) >= rank(b.source) ? a.source : b.source,
  };
}

const currentRoundOf = (progress: ProgressSnapshot) => Math.max(progress.currentRound, ...progress.rounds.map((round) => round.number + 1));

function unionEncoded(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined || b === undefined) return a ?? b;
  return encodeSlices(unionSlices(decodeSlices(a) ?? emptySlices(), decodeSlices(b) ?? emptySlices()));
}

function mergeProgress(a: ProgressSnapshot, b: ProgressSnapshot): ProgressSnapshot {
  const roundA = currentRoundOf(a);
  const roundB = currentRoundOf(b);
  const rounds = unionBy(a.rounds, b.rounds, (r) => String(r.number), (x, y) => pick(x, y, (r) => r.finishedAt)).sort((x, y) => x.number - y.number);
  const currentRound = Math.max(roundA, roundB, ...rounds.map((round) => round.number + 1));
  // What was heard in a round that has since been finished on the other device belongs to a round that is over.
  const sides = [a, b].filter((side) => currentRoundOf(side) === currentRound);
  const slices: Record<number, string> = {};
  for (const side of sides) {
    for (const [surah, text] of Object.entries(side.slices)) slices[Number(surah)] = unionEncoded(slices[Number(surah)], text)!;
  }
  const lifetime = mergeKeyed(
    a.lifetime as Record<string, SurahLifetime>,
    b.lifetime as Record<string, SurahLifetime>,
    mergeLifetime,
  ) as Record<number, SurahLifetime>;
  return {
    slices,
    lifetime,
    rounds,
    currentRound,
    roundStartedAt: sides.map((side) => side.roundStartedAt).reduce(smallerOrNull, null),
    roundSeconds: Math.max(0, ...sides.map((side) => side.roundSeconds)),
    paceSeconds: bigger(a.paceSeconds, b.paceSeconds),
    paceAyahs: bigger(a.paceAyahs, b.paceAyahs),
    legacyImportedAt: biggerOrNull(a.legacyImportedAt, b.legacyImportedAt),
  };
}

// Each device only writes its own cell, so the newer cell is the current one.
function mergeCounts(a: Counts, b: Counts): Counts {
  return mergeKeyed(a, b, (itemsA, itemsB) =>
    mergeKeyed(itemsA, itemsB, (devicesA, devicesB) => mergeKeyed(devicesA, devicesB, (x, y) => (x.at !== y.at ? (x.at > y.at ? x : y) : x.n >= y.n ? x : y))),
  );
}

function mergeZikir(a: ZikirSnapshot, b: ZikirSnapshot): ZikirSnapshot {
  const ordered = <T extends { id: string; createdAt: number }>(list: T[]) => list.sort((x, y) => x.createdAt - y.createdAt || byText(x.id, y.id));
  return {
    items: ordered(unionBy(a.items, b.items, (item) => item.id, (x, y) => pick(x, y, (item) => item.updatedAt))),
    groups: ordered(unionBy(a.groups, b.groups, (group) => group.id, (x, y) => pick(x, y, (group) => group.updatedAt))),
    counts: mergeCounts(a.counts, b.counts),
    history: unionBy(a.history, b.history, (entry) => entry.id, (x, y) => pick(x, y, (entry) => entry.finishedAt))
      .sort((x, y) => y.finishedAt - x.finishedAt || byText(x.id, y.id))
      .slice(0, ROUNDS_LIMIT),
    builtIns: mergeKeyed(a.builtIns, b.builtIns, (x, y) => pick(x, y, (entry) => entry.at)),
  };
}

export function mergeSnapshots(a: SyncSnapshot, b: SyncSnapshot): SyncSnapshot {
  return {
    library: mergeLibrary(a.library, b.library),
    stats: mergeStats(a.stats, b.stats),
    progress: mergeProgress(a.progress, b.progress),
    zikir: mergeZikir(a.zikir, b.zikir),
  };
}

export const sameSnapshot = (a: SyncSnapshot, b: SyncSnapshot) => stableStringify(a) === stableStringify(b);
