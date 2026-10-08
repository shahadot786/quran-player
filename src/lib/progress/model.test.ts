import { describe, expect, it } from "vitest";
import { SURAHS } from "../surahs";
import { MIN_PACE_AYAHS, MIN_PACE_SECONDS } from "./calc";
import { buildProgressModel, khatmDays, mostUsedReciter } from "./model";
import { encodeSlices, fullSlices, markUpTo, emptySlices } from "./slices";

const base = { slices: {}, paceSeconds: 0, paceAyahs: 0 };

describe("buildProgressModel", () => {
  it("describes an empty start", () => {
    const model = buildProgressModel(base);
    expect(model.overall).toMatchObject({ percent: 0, surahsFinished: 0, parasFinished: 0, surahsStarted: 0 });
    expect(model.surahs).toHaveLength(114);
    expect(model.surahs.every((cell) => cell.state === "not-started" && cell.coverage === 0)).toBe(true);
    expect(model.paras).toHaveLength(30);
    expect(model.pace).toBeNull();
  });

  it("gives every surah a state and a coverage", () => {
    const model = buildProgressModel({
      ...base,
      slices: { 1: encodeSlices(fullSlices()), 2: encodeSlices(markUpTo(emptySlices(), 0.5)), 3: "damaged!" },
    });
    expect(model.surahs[0]).toEqual({ id: 1, state: "finished", coverage: 1 });
    expect(model.surahs[1]).toEqual({ id: 2, state: "in-progress", coverage: 0.5 });
    expect(model.surahs[2]).toEqual({ id: 3, state: "not-started", coverage: 0 });
    expect(model.overall).toMatchObject({ surahsFinished: 1, surahsStarted: 2 });
  });

  it("orders paras 1 to 30 and flags the ones that are exact", () => {
    const model = buildProgressModel({ ...base, slices: Object.fromEntries(SURAHS.filter((s) => s.id >= 78).map((s) => [s.id, encodeSlices(fullSlices())])) });
    expect(model.paras.map((p) => p.juz)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(model.paras[29]).toMatchObject({ finished: true, exact: true, percent: 1 });
    expect(model.overall.parasFinished).toBe(1);
  });

  it("estimates time left only once there is enough tracked listening", () => {
    expect(buildProgressModel({ ...base, paceSeconds: MIN_PACE_SECONDS - 1, paceAyahs: 500 }).pace).toBeNull();
    const model = buildProgressModel({
      slices: { 1: encodeSlices(fullSlices()) },
      paceSeconds: MIN_PACE_SECONDS * 2,
      paceAyahs: MIN_PACE_AYAHS * 2,
    });
    expect(model.pace!.secondsPerAyah).toBeCloseTo((MIN_PACE_SECONDS * 2) / (MIN_PACE_AYAHS * 2), 6);
    expect(model.pace!.secondsLeft).toBeCloseTo(model.pace!.secondsPerAyah * (6236 - 7), 3);
  });
});

describe("mostUsedReciter", () => {
  it("picks the reciter with the most time", () => {
    expect(mostUsedReciter({ 1: { name: "A", seconds: 10 }, 2: { name: "B", seconds: 90 } })).toEqual({ id: 2, name: "B", seconds: 90 });
  });

  it("still names a reciter when only earlier, untimed listening is known", () => {
    expect(mostUsedReciter({ 4: { name: "D", seconds: 0 }, 5: { name: "E", seconds: 0 } })).toEqual({ id: 4, name: "D", seconds: 0 });
  });

  it("is null without reciters", () => {
    expect(mostUsedReciter({})).toBeNull();
  });
});

describe("khatmDays", () => {
  const day = 86_400_000;
  it("counts calendar days between start and finish, at least one", () => {
    expect(khatmDays({ number: 1, startedAt: 0, finishedAt: 5 * day + 1000, seconds: 0 })).toBe(6);
    expect(khatmDays({ number: 1, startedAt: 1000, finishedAt: 2000, seconds: 0 })).toBe(1);
  });
});
