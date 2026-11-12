import { describe, expect, it } from "vitest";
import { embedStats } from "./stats";

const today = new Date(2026, 10, 12, 12);

describe("embedStats", () => {
  it("is all zeros with no listening", () => {
    expect(embedStats({}, {}, today)).toEqual({ minutes: 0, streak: 0, finished: 0 });
  });

  it("counts whole minutes today, the streak and distinct finished surahs", () => {
    const daily = { "2026-11-12": 190, "2026-11-11": 60, "2026-11-10": 30 };
    const completed = { "5:1": {}, "5:2": {}, "9:2": {} };
    expect(embedStats(daily, completed, today)).toEqual({ minutes: 3, streak: 2, finished: 2 });
  });
});
