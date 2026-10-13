import { describe, expect, it } from "vitest";
import { encodeSlices, markRange, emptySlices } from "@/lib/progress/slices";
import { makeTrack } from "@/test/fixtures";
import { mergeSnapshots, sameSnapshot, stableStringify, syncWindow, unionSessions } from "./merge";
import { SYNC_SESSION_LIMIT } from "./limits";
import { MAX_DEVICES } from "@/lib/backup-guards";
import { isSyncSnapshot } from "./snapshot";
import type { SyncSnapshot } from "./types";

const EMPTY: SyncSnapshot = {
  library: { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] },
  stats: { totalSeconds: 0, daily: {}, reciters: {}, completed: {} },
  progress: { slices: {}, lifetime: {}, rounds: [], currentRound: 1, roundStartedAt: null, roundSeconds: 0, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: null },
  zikir: { items: [], groups: [], counts: {}, history: [], builtIns: {} },
};

const heard = (from: number, to: number) => encodeSlices(markRange(emptySlices(), from, to));
const withProgress = (progress: Partial<SyncSnapshot["progress"]>): SyncSnapshot => ({ ...EMPTY, progress: { ...EMPTY.progress, ...progress } });
const withZikir = (zikir: Partial<SyncSnapshot["zikir"]>): SyncSnapshot => ({ ...EMPTY, zikir: { ...EMPTY.zikir, ...zikir } });
const item = (id: string, updatedAt: number, extra: Partial<SyncSnapshot["zikir"]["items"][number]> = {}) => ({
  id,
  name: id,
  arabic: "",
  transliteration: "",
  meaning: "",
  target: 33,
  dailyGoal: null,
  createdAt: 1,
  updatedAt,
  deletedAt: null,
  ...extra,
});

describe("progress", () => {
  it("counts a slice as heard when either device heard it", () => {
    const merged = mergeSnapshots(withProgress({ slices: { 18: heard(0, 0.25) } }), withProgress({ slices: { 18: heard(0.5, 0.75) } }));
    expect(merged.progress.slices[18]).toBe(encodeSlices(markRange(markRange(emptySlices(), 0, 0.25), 0.5, 0.75)));
  });

  it("keeps the larger cumulative figures and the latest listening time", () => {
    const a = withProgress({ lifetime: { 1: { seconds: 100, completions: 2, lastAt: 50, reciters: { 7: { name: "A", seconds: 60 } }, source: null } } });
    const b = withProgress({ lifetime: { 1: { seconds: 80, completions: 3, lastAt: 90, reciters: { 7: { name: "A", seconds: 80 }, 8: { name: "B", seconds: 5 } }, source: "history" } } });
    const merged = mergeSnapshots(a, b).progress.lifetime[1]!;
    expect(merged).toMatchObject({ seconds: 100, completions: 3, lastAt: 90, source: "history" });
    expect(merged.reciters).toEqual({ 7: { name: "A", seconds: 80 }, 8: { name: "B", seconds: 5 } });
  });

  it("unions khatm rounds by number and lets the later round win", () => {
    const round = (number: number, finishedAt: number) => ({ number, startedAt: 0, finishedAt, seconds: 10 });
    const a = withProgress({ rounds: [round(1, 100)], currentRound: 2, slices: { 1: heard(0, 1) } });
    const b = withProgress({ rounds: [round(1, 100), round(2, 200)], currentRound: 3, slices: { 2: heard(0, 1) } });
    const merged = mergeSnapshots(a, b).progress;
    expect(merged.rounds.map((r) => r.number)).toEqual([1, 2]);
    expect(merged.currentRound).toBe(3);
    expect(Object.keys(merged.slices)).toEqual(["2"]);
  });
});

describe("khatm plan", () => {
  it("keeps the newer plan, including a newer removal", () => {
    const set = withProgress({ plan: { finishBy: "2027-03-08", updatedAt: 5 } });
    const removed = withProgress({ plan: { finishBy: null, updatedAt: 9 } });
    expect(mergeSnapshots(set, removed).progress.plan).toEqual({ finishBy: null, updatedAt: 9 });
    expect(mergeSnapshots(removed, set).progress.plan).toEqual({ finishBy: null, updatedAt: 9 });
    expect(mergeSnapshots(set, EMPTY).progress.plan).toEqual({ finishBy: "2027-03-08", updatedAt: 5 });
    expect(mergeSnapshots(EMPTY, EMPTY).progress.plan).toBeUndefined();
  });
});

describe("zikir", () => {
  it("adds up what two devices counted, and keeps the newer cell of one device", () => {
    const a = withZikir({ counts: { "2026-10-08": { dhikr: { phone: { n: 10, at: 5 } } } } });
    const b = withZikir({ counts: { "2026-10-08": { dhikr: { phone: { n: 7, at: 9 }, laptop: { n: 4, at: 3 } } } } });
    expect(mergeSnapshots(a, b).zikir.counts["2026-10-08"]!.dhikr).toEqual({ phone: { n: 7, at: 9 }, laptop: { n: 4, at: 3 } });
  });

  it("lets the later edit win and keeps a deletion from coming back", () => {
    const a = withZikir({ items: [item("x", 10, { name: "old" })] });
    const b = withZikir({ items: [item("x", 20, { name: "new", deletedAt: 20 })] });
    const merged = mergeSnapshots(a, b).zikir.items;
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ name: "new", deletedAt: 20 });
  });

  it("unions finished rounds by id and removals of built-ins by time", () => {
    const entry = (id: string) => ({ id, kind: "item" as const, refId: "x", name: null, count: 33, finishedAt: 1, completed: true });
    const a = withZikir({ history: [entry("1")], builtIns: { w: { removed: true, at: 5 } } });
    const b = withZikir({ history: [entry("1"), entry("2")], builtIns: { w: { removed: false, at: 9 } } });
    const merged = mergeSnapshots(a, b).zikir;
    expect(merged.history.map((h) => h.id).sort()).toEqual(["1", "2"]);
    expect(merged.builtIns.w).toEqual({ removed: false, at: 9 });
  });
});

describe("listening sessions", () => {
  const session = (id: string, startedAt: number, seconds = 60) => ({
    id, day: "2026-10-01", startedAt, updatedAt: startedAt, surah: 1, reciterId: 1, reciterName: "R", moshafId: 1, seconds,
  });
  const DAY = 24 * 60 * 60 * 1000;

  it("keeps each session once, the longer copy when both devices have it, newest first", () => {
    const merged = unionSessions([session("a", 1, 30), session("b", 3)], [session("a", 1, 90), session("c", 2)]);
    expect(merged.map((s) => [s.id, s.seconds])).toEqual([["b", 60], ["c", 60], ["a", 90]]);
  });

  it("sends only the last 90 days and at most the newest 500 to the cloud", () => {
    const newest = 400 * DAY;
    expect(syncWindow([session("new", newest), session("edge", newest - 90 * DAY), session("old", newest - 91 * DAY)]).map((s) => s.id)).toEqual(["new", "edge"]);
    const many = Array.from({ length: SYNC_SESSION_LIMIT + 10 }, (_, i) => session(`s${i}`, newest - i));
    expect(syncWindow(many)).toHaveLength(SYNC_SESSION_LIMIT);
  });

  it("leaves copies without a log alone, and fills in the log from whichever side has one", () => {
    expect(mergeSnapshots(EMPTY, EMPTY).sessions).toBeUndefined();
    expect(mergeSnapshots(EMPTY, { ...EMPTY, sessions: [session("a", 1)] }).sessions).toHaveLength(1);
  });
});

describe("removing from the library", () => {
  const lib = (patch: Partial<SyncSnapshot["library"]>): SyncSnapshot => ({ ...EMPTY, library: { ...EMPTY.library, ...patch } });
  const list = (id: string) => ({ id, name: id, tracks: [], createdAt: 1, updatedAt: 1 });

  it("keeps a favorite or playlist removed on one device removed after syncing with a device that still has it", () => {
    const phone = lib({ favoriteSurahs: [18], favoriteReciters: [{ id: 7, name: "R" }], playlists: [list("p")] });
    const laptop = lib({ marks: { "surah:18": { on: false, at: 9 }, "reciter:7": { on: false, at: 9 }, "playlist:p": { on: false, at: 9 } } });
    for (const merged of [mergeSnapshots(phone, laptop), mergeSnapshots(laptop, phone)]) {
      expect(merged.library.favoriteSurahs).toEqual([]);
      expect(merged.library.favoriteReciters).toEqual([]);
      expect(merged.library.playlists).toEqual([]);
    }
  });

  it("lets a later add win over an earlier removal", () => {
    const removed = lib({ marks: { "surah:18": { on: false, at: 5 } } });
    const readded = lib({ favoriteSurahs: [18], marks: { "surah:18": { on: true, at: 9 } } });
    expect(mergeSnapshots(removed, readded).library.favoriteSurahs).toEqual([18]);
  });

  it("treats copies without removals as before", () => {
    expect(mergeSnapshots(lib({ favoriteSurahs: [1] }), lib({ favoriteSurahs: [2] })).library).toEqual({ ...EMPTY.library, favoriteSurahs: [1, 2] });
  });
});

describe("devices", () => {
  const device = (name: string, updatedAt: number, removed = false) => ({ name, syncedAt: updatedAt, updatedAt, removed });
  const withDevices = (devices: NonNullable<SyncSnapshot["devices"]>): SyncSnapshot => ({ ...EMPTY, devices });

  it("lists the devices of both sides and keeps each one's latest entry", () => {
    const merged = mergeSnapshots(withDevices({ phone: device("Phone", 5), laptop: device("Laptop", 3) }), withDevices({ phone: device("My phone", 9), tablet: device("Tablet", 1) })).devices!;
    expect(Object.keys(merged).sort()).toEqual(["laptop", "phone", "tablet"]);
    expect(merged.phone!.name).toBe("My phone");
  });

  it("carries a removal, and lets the device come back by syncing again", () => {
    const removed = mergeSnapshots(withDevices({ tablet: device("Tablet", 4) }), withDevices({ tablet: device("Tablet", 8, true) })).devices!;
    expect(removed.tablet!.removed).toBe(true);
    const back = mergeSnapshots(withDevices(removed), withDevices({ tablet: device("Tablet", 12) })).devices!;
    expect(back.tablet!.removed).toBe(false);
  });

  it("keeps only the most recently touched devices when there are too many", () => {
    const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`d${String(i).padStart(2, "0")}`, device(`D${i}`, i)]));
    const merged = mergeSnapshots(withDevices(many), EMPTY).devices!;
    expect(Object.keys(merged)).toHaveLength(MAX_DEVICES);
    expect(merged.d39).toBeDefined();
    expect(merged.d00).toBeUndefined();
  });

  it("leaves copies without a device list alone", () => {
    expect(mergeSnapshots(EMPTY, EMPTY).devices).toBeUndefined();
  });
});

describe("ayah bookmarks", () => {
  const mark = (note: string, updatedAt: number, deletedAt: number | null = null) => ({ surah: 18, ayah: 10, note, createdAt: 1, updatedAt, deletedAt });

  it("keeps the later change of a bookmark, a removal included", () => {
    const a = { ...EMPTY, bookmarks: { "18:10": mark("old note", 5) } };
    const b = { ...EMPTY, bookmarks: { "18:10": mark("old note", 9, 9), "2:255": { ...mark("", 3), surah: 2, ayah: 255 } } };
    const merged = mergeSnapshots(a, b).bookmarks!;
    expect(merged["18:10"]).toMatchObject({ deletedAt: 9 });
    expect(Object.keys(merged).sort()).toEqual(["18:10", "2:255"]);
    expect(mergeSnapshots(EMPTY, EMPTY).bookmarks).toBeUndefined();
  });
});

describe("stats and library", () => {
  it("takes the larger total for each day and rebuilds the total from the days", () => {
    const stats = (daily: Record<string, number>, totalSeconds: number) => ({ ...EMPTY, stats: { ...EMPTY.stats, daily, totalSeconds } });
    const merged = mergeSnapshots(stats({ "2026-10-01": 60, "2026-10-02": 30 }, 90), stats({ "2026-10-01": 100, "2026-10-03": 20 }, 120)).stats;
    expect(merged.daily).toEqual({ "2026-10-01": 100, "2026-10-02": 30, "2026-10-03": 20 });
    expect(merged.totalSeconds).toBe(150);
  });

  it("keeps the newest 100 plays, one per recitation, and the later edit of a playlist", () => {
    const play = (surah: number, playedAt: number) => ({ track: makeTrack({ surah }), playedAt });
    const many = Array.from({ length: 80 }, (_, i) => play((i % 114) + 1, i));
    const more = Array.from({ length: 80 }, (_, i) => play((i % 114) + 1, 1000 + i));
    const merged = mergeSnapshots({ ...EMPTY, library: { ...EMPTY.library, history: many } }, { ...EMPTY, library: { ...EMPTY.library, history: more } });
    expect(merged.library.history).toHaveLength(80);
    expect(merged.library.history[0]!.playedAt).toBe(1079);

    const list = (name: string, updatedAt: number) => ({ id: "p", name, tracks: [], createdAt: 1, updatedAt });
    const playlists = mergeSnapshots(
      { ...EMPTY, library: { ...EMPTY.library, playlists: [list("a", 1)] } },
      { ...EMPTY, library: { ...EMPTY.library, playlists: [list("b", 2)] } },
    ).library.playlists;
    expect(playlists).toEqual([list("b", 2)]);
  });
});

function rng(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A device that last added an item has it and one that last removed it doesn't, so the marks are applied to the lists here.
function withMarks(snapshot: SyncSnapshot, random: () => number): SyncSnapshot {
  if (random() >= 0.6) return snapshot;
  const key = ["surah:1", "surah:2", "reciter:1", "playlist:p1"][Math.floor(random() * 4)]!;
  const [kind, id] = key.split(":") as [string, string];
  // Playlists are only ever marked when deleted: a new playlist always gets a new id.
  const on = kind !== "playlist" && random() < 0.5;
  const library = { ...snapshot.library, marks: { [key]: { on, at: Math.floor(random() * 20) } } };
  if (kind === "surah") {
    const others = library.favoriteSurahs.filter((surah) => surah !== Number(id));
    library.favoriteSurahs = on ? [...others, Number(id)].sort((x, y) => x - y) : others;
  } else if (kind === "reciter") {
    const others = library.favoriteReciters.filter((reciter) => reciter.id !== Number(id));
    library.favoriteReciters = on ? [...others, { id: Number(id), name: "R" }] : others;
  } else {
    library.playlists = library.playlists.filter((playlist) => playlist.id !== id);
  }
  return { ...snapshot, library };
}

function randomSnapshot(random: () => number): SyncSnapshot {
  return withMarks(randomSnapshotWithoutMarks(random), random);
}

function randomSnapshotWithoutMarks(random: () => number): SyncSnapshot {
  const int = (max: number) => Math.floor(random() * max);
  const some = <T>(count: number, make: () => T) => Array.from({ length: int(count) }, make);
  const slices: Record<number, string> = {};
  for (const surah of some(4, () => 1 + int(3))) slices[surah] = heard(random() * 0.5, 0.5 + random() * 0.5);
  const lifetime: Record<number, SyncSnapshot["progress"]["lifetime"][number]> = {};
  for (const surah of some(3, () => 1 + int(3))) {
    lifetime[surah] = {
      seconds: int(500),
      completions: int(4),
      lastAt: random() < 0.3 ? null : int(1000),
      reciters: { [1 + int(2)]: { name: random() < 0.5 ? "A" : "B", seconds: int(300) } },
      source: [null, "finished", "resume", "history"][int(4)] as never,
    };
  }
  const day = () => `2026-10-0${1 + int(3)}`;
  const daily: Record<string, number> = {};
  for (const key of some(3, day)) daily[key] = int(1000);
  const counts: SyncSnapshot["zikir"]["counts"] = {};
  for (const key of some(3, day)) counts[key] = { [`i${int(2)}`]: { [`d${int(2)}`]: { n: int(50), at: int(100) } } };
  return {
    library: {
      favoriteReciters: some(3, () => ({ id: int(3), name: "R" })),
      favoriteSurahs: [...new Set(some(4, () => 1 + int(5)))].sort((a, b) => a - b),
      playlists: some(3, () => ({ id: `p${int(3)}`, name: `n${int(3)}`, tracks: [], createdAt: int(3), updatedAt: int(10) })),
      history: some(5, () => ({ track: makeTrack({ moshafId: int(3), surah: 1 + int(3) }), playedAt: int(100) })),
    },
    stats: {
      totalSeconds: int(2000),
      daily,
      reciters: { [int(2)]: { name: "A", seconds: int(100) } },
      completed: { [`m:${int(2)}`]: { surah: 1, reciterId: 1, count: int(5), lastAt: int(50) } },
    },
    progress: {
      slices,
      lifetime,
      rounds: some(3, () => ({ number: 1 + int(3), startedAt: int(10), finishedAt: int(100), seconds: int(100) })),
      currentRound: 1 + int(3),
      roundStartedAt: random() < 0.3 ? null : int(100),
      roundSeconds: int(100),
      paceSeconds: int(100),
      paceAyahs: int(100),
      legacyImportedAt: random() < 0.5 ? null : int(100),
      ...(random() < 0.5 ? { plan: { finishBy: random() < 0.3 ? null : `2027-0${1 + int(3)}-01`, updatedAt: int(20) } } : {}),
    },
    zikir: {
      items: some(3, () => item(`i${int(3)}`, int(10), { name: `n${int(3)}`, deletedAt: random() < 0.3 ? int(10) : null })),
      groups: [],
      counts,
      history: some(4, () => ({ id: `h${int(4)}`, kind: "item" as const, refId: "x", name: null, count: 1 + int(5), finishedAt: int(100), completed: true })),
      builtIns: { [`b${int(2)}`]: { removed: random() < 0.5, at: int(20) } },
    },
    ...(random() < 0.6
      ? {
          devices: Object.fromEntries(some(3, () => int(4)).map((k) => [`dev${k}`, { name: `Device ${int(3)}`, syncedAt: int(50), updatedAt: int(50), removed: random() < 0.3 }])),
        }
      : {}),
    ...(random() < 0.6
      ? {
          bookmarks: Object.fromEntries(
            some(3, () => 1 + int(3)).map((surah) => [`${surah}:1`, { surah, ayah: 1, note: `n${int(3)}`, createdAt: 1, updatedAt: int(20), deletedAt: random() < 0.3 ? int(20) : null }]),
          ),
        }
      : {}),
    ...(random() < 0.7
      ? {
          sessions: unionSessions(
            // A session's id and start never change once it exists; only its length grows.
            some(5, () => int(6)).map((k) => ({ id: `s${k}`, day: "2026-10-01", startedAt: k * 3e9, updatedAt: 1, surah: 1, reciterId: 1, reciterName: "R", moshafId: 1, seconds: int(100) })),
            [],
          ),
        }
      : {}),
  };
}

describe("merging is safe to repeat and to do in any order", () => {
  const random = rng(20261008);
  const trials = Array.from({ length: 150 }, () => [randomSnapshot(random), randomSnapshot(random), randomSnapshot(random)] as const);

  it("produces valid snapshots", () => {
    for (const [a, b] of trials) {
      expect(isSyncSnapshot(a)).toBe(true);
      expect(isSyncSnapshot(mergeSnapshots(a, b))).toBe(true);
    }
  });

  it("is idempotent", () => {
    for (const [a] of trials) expect(sameSnapshot(mergeSnapshots(a, a), mergeSnapshots(a, mergeSnapshots(a, a)))).toBe(true);
    for (const [a, b] of trials) {
      const merged = mergeSnapshots(a, b);
      expect(sameSnapshot(mergeSnapshots(merged, b), merged)).toBe(true);
      expect(sameSnapshot(mergeSnapshots(merged, a), merged)).toBe(true);
    }
  });

  it("is commutative", () => {
    for (const [a, b] of trials) expect(stableStringify(mergeSnapshots(a, b))).toBe(stableStringify(mergeSnapshots(b, a)));
  });

  it("is associative", () => {
    for (const [a, b, c] of trials) {
      expect(stableStringify(mergeSnapshots(mergeSnapshots(a, b), c))).toBe(stableStringify(mergeSnapshots(a, mergeSnapshots(b, c))));
    }
  });
});
