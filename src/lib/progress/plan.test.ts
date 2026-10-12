import { describe, expect, it } from "vitest";
import { AYAH_TOTAL } from "./juz";
import { planTarget } from "./plan";

describe("planTarget", () => {
  it("spreads what is left over the days to the finish date, counting today and that day", () => {
    const target = planTarget({ finishBy: "2026-10-21", today: "2026-10-12", ayahsLeft: 1000, secondsPerAyah: 6 });
    expect(target).toEqual({ status: "on", daysLeft: 10, ayahsPerDay: 100, parasPerDay: 100 / (AYAH_TOTAL / 30), secondsPerDay: 600 });
  });

  it("asks for the whole rest today when the finish date is today", () => {
    expect(planTarget({ finishBy: "2026-10-12", today: "2026-10-12", ayahsLeft: 50, secondsPerAyah: null })).toMatchObject({ status: "on", daysLeft: 1, ayahsPerDay: 50, secondsPerDay: null });
  });

  it("rounds a share up so the round is finished in time", () => {
    expect(planTarget({ finishBy: "2026-10-14", today: "2026-10-12", ayahsLeft: 10, secondsPerAyah: null })).toMatchObject({ ayahsPerDay: 4 });
  });

  it("says when the date has passed or the round is already done", () => {
    expect(planTarget({ finishBy: "2026-10-11", today: "2026-10-12", ayahsLeft: 10, secondsPerAyah: null })).toEqual({ status: "overdue", ayahsLeft: 10 });
    expect(planTarget({ finishBy: "2026-10-30", today: "2026-10-12", ayahsLeft: 0, secondsPerAyah: null })).toEqual({ status: "done" });
  });

  it("counts calendar days across a change of clocks", () => {
    expect(planTarget({ finishBy: "2026-11-02", today: "2026-10-24", ayahsLeft: 100, secondsPerAyah: null })).toMatchObject({ daysLeft: 10 });
  });
});
