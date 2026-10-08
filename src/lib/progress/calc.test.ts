import { describe, expect, it } from "vitest";
import { SURAHS } from "../surahs";
import { AYAH_TOTAL } from "./juz";
import {
  MIN_PACE_AYAHS,
  MIN_PACE_SECONDS,
  overallProgress,
  paceEstimate,
  paraProgress,
  isRoundComplete,
  surahState,
  type SliceLookup,
} from "./calc";
import { emptySlices, fullSlices, markUpTo, type Slices } from "./slices";

const lookup =
  (heard: Record<number, Slices>): SliceLookup =>
  (surah) =>
    heard[surah];
const everySurah = (slices: Slices) => Object.fromEntries(SURAHS.map((s) => [s.id, slices]));
const surahRange = (from: number, to: number, slices: Slices) =>
  Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [from + i, slices]));

describe("surahState", () => {
  it("classifies by how much was heard", () => {
    expect(surahState(undefined)).toBe("not-started");
    expect(surahState(emptySlices())).toBe("not-started");
    expect(surahState(markUpTo(emptySlices(), 0.5))).toBe("in-progress");
    expect(surahState(markUpTo(emptySlices(), 0.94))).toBe("in-progress");
    expect(surahState(markUpTo(emptySlices(), 0.95))).toBe("finished");
  });
});

describe("paraProgress", () => {
  it("is exact and complete when every surah of a whole-surah para is finished", () => {
    const result = paraProgress(30, lookup(surahRange(78, 114, fullSlices())));
    expect(result).toMatchObject({ juz: 30, percent: 1, finished: true, exact: true });
    expect(result.surahs).toHaveLength(37);
  });

  it("is exact and empty when nothing was heard", () => {
    expect(paraProgress(30, lookup({}))).toMatchObject({ percent: 0, finished: false, exact: true });
    expect(paraProgress(2, lookup({}))).toMatchObject({ percent: 0, finished: false, exact: true });
  });

  it("stays exact for a partly heard whole-surah para, weighted by ayahs", () => {
    const heard = { ...surahRange(78, 114, fullSlices()), 78: markUpTo(emptySlices(), 0.5) };
    const result = paraProgress(30, lookup(heard));
    const total = 564;
    const expected = (total - 40 * 0.5) / total;
    expect(result.percent).toBeCloseTo(expected, 3);
    expect(result).toMatchObject({ finished: false, exact: true });
  });

  it("weights the portions of a para by their ayah counts", () => {
    const result = paraProgress(1, lookup({ 1: fullSlices() }));
    expect(result.percent).toBeCloseTo(7 / 148, 6);
    expect(result.surahs).toEqual([1, 2]);
    expect(result.finished).toBe(false);
  });

  it("is estimated, and finished only when the whole portion is heard, for a split surah", () => {
    const half = markUpTo(emptySlices(), 0.5);
    const partial = paraProgress(2, lookup({ 2: half }));
    expect(partial.exact).toBe(false);
    expect(partial.finished).toBe(false);
    expect(partial.percent).toBeGreaterThan(0);
    expect(partial.percent).toBeLessThan(0.05);

    const finishedSurah = paraProgress(2, lookup({ 2: fullSlices() }));
    expect(finishedSurah).toMatchObject({ percent: 1, finished: true, exact: true });
  });

  it("finishes a para that sits inside one surah once its share of the surah is heard", () => {
    const upToJuzEnd = markUpTo(emptySlices(), 252 / 286 + 0.001);
    expect(paraProgress(2, lookup({ 2: upToJuzEnd })).percent).toBeLessThan(1);
    const heard = paraProgress(2, lookup({ 2: markUpTo(emptySlices(), 0.9999) }));
    expect(heard.finished).toBe(true);
  });

  it("returns an empty result for an unknown para", () => {
    expect(paraProgress(99, lookup({}))).toEqual({ juz: 99, percent: 0, finished: false, exact: true, surahs: [] });
  });
});

describe("overallProgress", () => {
  it("is empty before anything is heard", () => {
    expect(overallProgress(lookup({}))).toEqual({
      percent: 0,
      ayahsHeard: 0,
      ayahsTotal: AYAH_TOTAL,
      surahsStarted: 0,
      surahsFinished: 0,
      parasFinished: 0,
    });
  });

  it("is complete when everything is heard", () => {
    expect(overallProgress(lookup(everySurah(fullSlices())))).toMatchObject({
      percent: 1,
      ayahsHeard: AYAH_TOTAL,
      surahsStarted: 114,
      surahsFinished: 114,
      parasFinished: 30,
    });
  });

  it("counts a finished surah by its ayahs", () => {
    const result = overallProgress(lookup({ 1: fullSlices() }));
    expect(result).toMatchObject({ ayahsHeard: 7, surahsStarted: 1, surahsFinished: 1, parasFinished: 0 });
    expect(result.percent).toBeCloseTo(7 / AYAH_TOTAL, 8);
  });

  it("counts a partly heard surah proportionally and as started, not finished", () => {
    const result = overallProgress(lookup({ 2: markUpTo(emptySlices(), 0.5) }));
    expect(result.ayahsHeard).toBe(143);
    expect(result).toMatchObject({ surahsStarted: 1, surahsFinished: 0 });
  });

  it("counts paras finished from whole-surah paras", () => {
    const result = overallProgress(lookup(surahRange(78, 114, fullSlices())));
    expect(result.parasFinished).toBe(1);
    expect(result.surahsFinished).toBe(37);
  });
});

describe("isRoundComplete", () => {
  it("needs every surah finished", () => {
    expect(isRoundComplete(lookup(everySurah(fullSlices())))).toBe(true);
    expect(isRoundComplete(lookup({ ...everySurah(fullSlices()), 55: markUpTo(emptySlices(), 0.9) }))).toBe(false);
    expect(isRoundComplete(lookup({}))).toBe(false);
  });
});

describe("paceEstimate", () => {
  it("stays hidden until there is enough tracked listening", () => {
    expect(paceEstimate({ trackedSeconds: MIN_PACE_SECONDS - 1, trackedAyahs: 500, remainingAyahs: 1000 })).toBeNull();
    expect(paceEstimate({ trackedSeconds: 5000, trackedAyahs: MIN_PACE_AYAHS - 1, remainingAyahs: 1000 })).toBeNull();
  });

  it("estimates time left from the listener's own pace", () => {
    expect(paceEstimate({ trackedSeconds: 1200, trackedAyahs: 100, remainingAyahs: 600 })).toEqual({ secondsPerAyah: 12, secondsLeft: 7200 });
  });

  it("is zero when nothing is left", () => {
    expect(paceEstimate({ trackedSeconds: 1200, trackedAyahs: 100, remainingAyahs: 0 })).toEqual({ secondsPerAyah: 12, secondsLeft: 0 });
  });
});
