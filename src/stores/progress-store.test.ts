import { beforeEach, describe, expect, it } from "vitest";
import { SURAHS } from "@/lib/surahs";
import { countSlices, decodeSlices, emptySlices, encodeSlices, fullSlices, isFinished, markRange } from "@/lib/progress/slices";
import { sliceLookup } from "@/lib/progress/lookup";
import { useProgressStore } from "./progress-store";

const progress = () => useProgressStore.getState();
const reciter = { id: 1, name: "Mishary Alafasi" };
const batch = (surah: number, from: number, to: number, seconds = 60, duration = 600, who = reciter) => ({
  surah,
  reciter: who,
  slices: markRange(emptySlices(), from, to),
  seconds,
  duration,
});
const heard = (surah: number) => decodeSlices(progress().slices[surah] ?? "") ?? emptySlices();

beforeEach(() => useProgressStore.setState(useProgressStore.getInitialState(), true));

describe("applyPlayback", () => {
  it("records what was heard, the time and the reciter", () => {
    progress().applyPlayback(batch(18, 0, 0.1, 60), 5000);
    expect(countSlices(heard(18))).toBe(20);
    expect(progress().lifetime[18]).toMatchObject({ seconds: 60, completions: 0, lastAt: 5000, source: null });
    expect(progress().lifetime[18]!.reciters[1]).toEqual({ name: "Mishary Alafasi", seconds: 60 });
    expect(progress().roundStartedAt).toBe(5000);
  });

  it("combines with what was heard before, and adds up time per reciter", () => {
    progress().applyPlayback(batch(18, 0, 0.1, 60), 1000);
    progress().applyPlayback(batch(18, 0.05, 0.3, 90, 600, { id: 2, name: "Saad Al-Ghamdi" }), 2000);
    expect(countSlices(heard(18))).toBe(60);
    expect(progress().lifetime[18]).toMatchObject({ seconds: 150, lastAt: 2000 });
    expect(Object.keys(progress().lifetime[18]!.reciters)).toEqual(["1", "2"]);
    expect(progress().roundStartedAt).toBe(1000);
  });

  it("measures pace from newly heard audio only, not from replays", () => {
    progress().applyPlayback(batch(1, 0, 0.5, 10, 600), 1);
    expect(progress().paceSeconds).toBeCloseTo(300, 6);
    expect(progress().paceAyahs).toBeCloseTo(3.5, 6);
    progress().applyPlayback(batch(1, 0, 0.5, 300, 600), 2);
    expect(progress().paceSeconds).toBeCloseTo(300, 6);
    expect(progress().paceAyahs).toBeCloseTo(3.5, 6);
  });

  it("counts a surah as completed once, when it becomes finished", () => {
    progress().applyPlayback(batch(112, 0, 0.9), 1000);
    expect(progress().lifetime[112]!.completions).toBe(0);
    progress().applyPlayback(batch(112, 0.9, 1), 2000);
    expect(progress().lifetime[112]!.completions).toBe(1);
    progress().applyPlayback(batch(112, 0, 1), 3000);
    expect(progress().lifetime[112]!.completions).toBe(1);
    expect(isFinished(heard(112))).toBe(true);
  });

  it("ignores a batch with nothing in it", () => {
    const before = progress();
    progress().applyPlayback({ surah: 18, reciter, slices: emptySlices(), seconds: 0, duration: 600 }, 1);
    expect(progress().slices).toBe(before.slices);
    expect(progress().lifetime).toBe(before.lifetime);
  });

  it("keeps time even when no new slices were heard", () => {
    progress().applyPlayback(batch(18, 0, 0.1, 60), 1000);
    progress().applyPlayback(batch(18, 0, 0.1, 40), 2000);
    expect(progress().lifetime[18]!.seconds).toBe(100);
    expect(countSlices(heard(18))).toBe(20);
  });

  it("ignores a surah that does not exist", () => {
    progress().applyPlayback(batch(0, 0, 0.5), 1);
    progress().applyPlayback(batch(115, 0, 0.5), 1);
    expect(progress().slices).toEqual({});
  });
});

describe("rounds (khatm)", () => {
  function finishAllExcept(surah: number) {
    const slices = Object.fromEntries(SURAHS.filter((s) => s.id !== surah).map((s) => [s.id, encodeSlices(fullSlices())]));
    useProgressStore.setState({ slices, roundStartedAt: 1000, roundSeconds: 3600 });
  }

  it("records a completed round when the last surah is finished and starts a new one", () => {
    finishAllExcept(112);
    progress().applyPlayback(batch(112, 0, 1, 100), 9000);
    expect(progress().rounds).toEqual([{ number: 1, startedAt: 1000, finishedAt: 9000, seconds: 3700 }]);
    expect(progress().currentRound).toBe(2);
    expect(progress().slices).toEqual({});
    expect(progress().roundStartedAt).toBeNull();
    expect(progress().roundSeconds).toBe(0);
    expect(progress().lifetime[112]).toMatchObject({ completions: 1, seconds: 100 });
  });

  it("keeps lifetime figures when a new round starts", () => {
    progress().applyPlayback(batch(18, 0, 0.1, 60), 1000);
    finishAllExcept(112);
    useProgressStore.setState((s) => ({ slices: { ...s.slices, 18: encodeSlices(fullSlices()) } }));
    progress().applyPlayback(batch(112, 0, 1, 10), 5000);
    expect(progress().lifetime[18]!.seconds).toBe(60);
  });

  it("lets a surah be finished again in the next round", () => {
    finishAllExcept(112);
    progress().applyPlayback(batch(112, 0, 1), 1);
    progress().applyPlayback(batch(112, 0, 1), 2);
    expect(progress().lifetime[112]!.completions).toBe(2);
    expect(progress().rounds).toHaveLength(1);
  });
});

describe("importLegacy", () => {
  const legacy = {
    completed: { "10:1": { surah: 1, reciterId: 1, count: 2, lastAt: 4000 } },
    reciters: { 1: { name: "Mishary Alafasi" } },
    positions: { "10:18": { time: 300, duration: 1000, updatedAt: 6000, track: { surah: 18, reciterId: 1, reciterName: "Mishary Alafasi" } } },
    history: [{ track: { surah: 67, reciterId: 1, reciterName: "Mishary Alafasi" }, playedAt: 3000 }],
  };

  it("brings in finished surahs, resume points and history as round 1", () => {
    progress().importLegacy(legacy, 9000);
    expect(isFinished(heard(1))).toBe(true);
    expect(countSlices(heard(18))).toBe(60);
    expect(progress().lifetime[1]).toMatchObject({ completions: 2, lastAt: 4000, seconds: 0, source: "finished" });
    expect(progress().lifetime[18]).toMatchObject({ lastAt: 6000, source: "resume" });
    expect(progress().lifetime[67]).toMatchObject({ lastAt: 3000, source: "history" });
    expect(progress().slices[67]).toBeUndefined();
    expect(progress().legacyImportedAt).toBe(9000);
  });

  it("runs only once", () => {
    progress().importLegacy(legacy, 9000);
    const after = progress();
    progress().importLegacy({ ...legacy, completed: {} }, 10000);
    expect(progress().slices).toBe(after.slices);
    expect(progress().legacyImportedAt).toBe(9000);
  });

  it("still marks itself done when there is nothing to import", () => {
    progress().importLegacy({ completed: {}, reciters: {}, positions: {}, history: [] }, 123);
    expect(progress().legacyImportedAt).toBe(123);
    expect(progress().slices).toEqual({});
  });

  it("does not overwrite progress already recorded before the import ran", () => {
    progress().applyPlayback(batch(1, 0, 0.5, 30), 1000);
    progress().importLegacy(legacy, 9000);
    expect(isFinished(heard(1))).toBe(true);
    expect(progress().lifetime[1]).toMatchObject({ seconds: 30, completions: 2, lastAt: 4000 });
  });

  it("records a round when the old data already covers the whole Quran", () => {
    const completed = Object.fromEntries(SURAHS.map((s) => [`10:${s.id}`, { surah: s.id, reciterId: 1, count: 1, lastAt: 100 + s.id }]));
    progress().importLegacy({ ...legacy, completed }, 9000);
    expect(progress().rounds).toHaveLength(1);
    expect(progress().currentRound).toBe(2);
  });
});

describe("reset", () => {
  it("clears everything and will not import old data again", () => {
    progress().applyPlayback(batch(18, 0, 0.5), 1000);
    progress().reset(7000);
    expect(progress()).toMatchObject({ slices: {}, lifetime: {}, rounds: [], currentRound: 1, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: 7000 });
  });
});

describe("sliceLookup", () => {
  it("reads saved slices and treats missing or damaged ones as unheard", () => {
    const lookup = sliceLookup({ 1: encodeSlices(fullSlices()), 2: "broken!" });
    expect(isFinished(lookup(1)!)).toBe(true);
    expect(lookup(2)).toBeUndefined();
    expect(lookup(3)).toBeUndefined();
  });
});
