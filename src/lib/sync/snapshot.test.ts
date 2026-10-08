import { describe, expect, it } from "vitest";
import { isSyncSnapshot } from "./snapshot";

const valid = {
  library: { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] },
  stats: { totalSeconds: 0, daily: {}, reciters: {}, completed: {} },
  progress: { slices: {}, lifetime: {}, rounds: [], currentRound: 1, roundStartedAt: null, roundSeconds: 0, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: null },
  zikir: { items: [], groups: [], counts: {}, history: [], builtIns: {} },
};

describe("isSyncSnapshot", () => {
  it("accepts an empty snapshot", () => expect(isSyncSnapshot(valid)).toBe(true));

  it("rejects a missing part", () => {
    for (const part of Object.keys(valid)) expect(isSyncSnapshot({ ...valid, [part]: undefined })).toBe(false);
  });

  it("rejects wrong shapes inside a part", () => {
    expect(isSyncSnapshot({ ...valid, stats: { ...valid.stats, daily: { "2026-10-01": "x" } } })).toBe(false);
    expect(isSyncSnapshot({ ...valid, progress: { ...valid.progress, slices: { 1: "not-slices" } } })).toBe(false);
    expect(isSyncSnapshot({ ...valid, zikir: { ...valid.zikir, counts: { today: {} } } })).toBe(false);
    expect(isSyncSnapshot(null)).toBe(false);
    expect(isSyncSnapshot([])).toBe(false);
  });
});
