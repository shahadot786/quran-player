import { describe, expect, it } from "vitest";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { useStatsStore } from "@/stores/stats-store";
import { legacyToSeeds, type LegacyInput } from "./legacy";
import { countSlices, isFinished } from "./slices";

const track = (surah: number, reciterId = 1, reciterName = "Mishary Alafasi") => ({ surah, reciterId, reciterName });
const input = (overrides: Partial<LegacyInput> = {}): LegacyInput => ({
  completed: {},
  reciters: {},
  positions: {},
  history: [],
  ...overrides,
});

describe("legacyToSeeds", () => {
  it("returns nothing for an empty history", () => {
    expect(legacyToSeeds(input())).toEqual({});
  });

  it("turns completed surahs into finished ones, adding up completions across recitations", () => {
    const seeds = legacyToSeeds(
      input({
        completed: {
          "10:1": { surah: 1, reciterId: 1, count: 3, lastAt: 1000 },
          "11:1": { surah: 1, reciterId: 2, count: 1, lastAt: 5000 },
          "10:36": { surah: 36, reciterId: 1, count: 1, lastAt: 2000 },
        },
        reciters: { 1: { name: "Mishary Alafasi" }, 2: { name: "Saad Al-Ghamdi" } },
      }),
    );
    expect(Object.keys(seeds).sort()).toEqual(["1", "36"]);
    expect(seeds[1]).toMatchObject({ completions: 4, lastAt: 5000, source: "finished" });
    expect(isFinished(seeds[1]!.slices)).toBe(true);
    expect(seeds[1]!.reciters).toEqual({ 1: { name: "Mishary Alafasi", seconds: 0 }, 2: { name: "Saad Al-Ghamdi", seconds: 0 } });
    expect(seeds[36]).toMatchObject({ completions: 1, lastAt: 2000 });
  });

  it("turns a resume point into a partly heard surah, counting only slices fully passed", () => {
    const seeds = legacyToSeeds(
      input({ positions: { "10:18": { time: 300, duration: 1000, updatedAt: 7000, track: track(18) } } }),
    );
    expect(seeds[18]).toMatchObject({ completions: 0, lastAt: 7000, source: "resume" });
    expect(countSlices(seeds[18]!.slices)).toBe(60);
  });

  it("keeps the furthest resume point when a surah has several", () => {
    const seeds = legacyToSeeds(
      input({
        positions: {
          "10:18": { time: 100, duration: 1000, updatedAt: 9000, track: track(18) },
          "11:18": { time: 500, duration: 1000, updatedAt: 3000, track: track(18, 2, "Saad Al-Ghamdi") },
        },
      }),
    );
    expect(countSlices(seeds[18]!.slices)).toBe(100);
    expect(seeds[18]!.lastAt).toBe(9000);
  });

  it("does not downgrade a finished surah because another recitation is in progress", () => {
    const seeds = legacyToSeeds(
      input({
        completed: { "10:2": { surah: 2, reciterId: 1, count: 1, lastAt: 1000 } },
        positions: { "11:2": { time: 10, duration: 1000, updatedAt: 8000, track: track(2, 2, "Saad Al-Ghamdi") } },
      }),
    );
    expect(isFinished(seeds[2]!.slices)).toBe(true);
    expect(seeds[2]).toMatchObject({ source: "finished", lastAt: 8000, completions: 1 });
  });

  it("uses history for last-listened dates and to note surahs that were started", () => {
    const seeds = legacyToSeeds(
      input({
        completed: { "10:1": { surah: 1, reciterId: 1, count: 1, lastAt: 1000 } },
        history: [
          { track: track(1), playedAt: 6000 },
          { track: track(1), playedAt: 4000 },
          { track: track(67), playedAt: 3000 },
        ],
      }),
    );
    expect(seeds[1]!.lastAt).toBe(6000);
    expect(seeds[67]).toMatchObject({ completions: 0, lastAt: 3000, source: "history" });
    expect(countSlices(seeds[67]!.slices)).toBe(0);
  });

  it("falls back to track names, then ids, for reciters", () => {
    const seeds = legacyToSeeds(
      input({
        completed: { "10:1": { surah: 1, reciterId: 9, count: 1, lastAt: 1 } },
        history: [{ track: track(1, 9, "Hani Arrifai"), playedAt: 2 }],
      }),
    );
    expect(seeds[1]!.reciters[9]).toEqual({ name: "Hani Arrifai", seconds: 0 });
    const unnamed = legacyToSeeds(input({ completed: { "10:1": { surah: 1, reciterId: 4, count: 1, lastAt: 1 } } }));
    expect(unnamed[1]!.reciters[4]).toEqual({ name: "4", seconds: 0 });
  });

  it("skips malformed entries instead of failing", () => {
    const seeds = legacyToSeeds(
      input({
        completed: { bad: { surah: 0, reciterId: 1, count: 1, lastAt: 1 }, worse: { surah: 115, reciterId: 1, count: 1, lastAt: 1 } },
        positions: {
          a: { time: 5, duration: 0, updatedAt: 1, track: track(5) },
          b: { time: Number.NaN, duration: 10, updatedAt: 1, track: track(6) },
        },
        history: [{ track: track(200), playedAt: 1 }],
      }),
    );
    expect(seeds[5]).toMatchObject({ source: "resume" });
    expect(countSlices(seeds[5]!.slices)).toBe(0);
    expect(seeds[6]).toMatchObject({ source: "resume" });
    expect(Object.keys(seeds).sort()).toEqual(["5", "6"]);
  });

  it("accepts exactly the shapes the real stores hold", () => {
    const real: LegacyInput = {
      completed: useStatsStore.getState().completed,
      reciters: useStatsStore.getState().reciters,
      positions: usePlayerStore.getState().positions,
      history: useLibraryStore.getState().history,
    };
    expect(legacyToSeeds(real)).toEqual({});
  });

  it("does not modify its input", () => {
    const source = input({ completed: { "10:1": { surah: 1, reciterId: 1, count: 1, lastAt: 1 } } });
    const copy = JSON.parse(JSON.stringify(source));
    legacyToSeeds(source);
    expect(source).toEqual(copy);
  });
});
