import { describe, expect, it } from "vitest";
import { localDateKey } from "./format";
import { computeStreaks, distinctCompleted, lastDays, STREAK_MIN_SECONDS, topReciters } from "./stats";

const TODAY = new Date(2026, 8, 30, 15, 0);

function daysAgo(count: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - count);
  return localDateKey(date);
}

function dailyFor(offsets: number[], seconds = STREAK_MIN_SECONDS) {
  return Object.fromEntries(offsets.map((offset) => [daysAgo(offset), seconds]));
}

describe("computeStreaks", () => {
  it("is zero without listening", () => {
    expect(computeStreaks({}, TODAY)).toEqual({ current: 0, longest: 0 });
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreaks(dailyFor([0, 1, 2]), TODAY)).toEqual({ current: 3, longest: 3 });
  });

  it("keeps the streak alive when today has not reached a minute yet", () => {
    expect(computeStreaks({ ...dailyFor([1, 2]), [daysAgo(0)]: 30 }, TODAY)).toEqual({ current: 2, longest: 2 });
  });

  it("resets the current streak after a missed day but remembers the longest", () => {
    expect(computeStreaks(dailyFor([2, 3, 4, 5]), TODAY)).toEqual({ current: 0, longest: 4 });
  });

  it("ignores days under the threshold", () => {
    expect(computeStreaks(dailyFor([0, 1], STREAK_MIN_SECONDS - 1), TODAY)).toEqual({ current: 0, longest: 0 });
  });

  it("finds the longest run separate from the current one", () => {
    expect(computeStreaks(dailyFor([0, 1, 5, 6, 7, 8]), TODAY)).toEqual({ current: 2, longest: 4 });
  });

  it("treats days across a month boundary as consecutive", () => {
    const daily = { "2026-08-31": 100, "2026-09-01": 100 };
    expect(computeStreaks(daily, new Date(2026, 8, 1, 9)).longest).toBe(2);
  });
});

describe("lastDays", () => {
  it("returns seven days oldest first, ending today, with zeros for gaps", () => {
    const days = lastDays({ [daysAgo(0)]: 600, [daysAgo(6)]: 120 }, 7, TODAY);
    expect(days).toHaveLength(7);
    expect(localDateKey(days[0]!.date)).toBe(daysAgo(6));
    expect(localDateKey(days[6]!.date)).toBe(daysAgo(0));
    expect(days.map((d) => d.seconds)).toEqual([120, 0, 0, 0, 0, 0, 600]);
  });
});

describe("topReciters", () => {
  it("orders by time listened and caps the list", () => {
    const reciters = {
      1: { name: "A", seconds: 10 },
      2: { name: "B", seconds: 300 },
      3: { name: "C", seconds: 60 },
    };
    expect(topReciters(reciters, 2)).toEqual([
      { id: 2, name: "B", seconds: 300 },
      { id: 3, name: "C", seconds: 60 },
    ]);
  });
});

describe("distinctCompleted", () => {
  it("counts each surah once across reciters", () => {
    expect(distinctCompleted({ "1:1": { surah: 1 }, "2:1": { surah: 1 }, "1:2": { surah: 2 } })).toBe(2);
  });
});
