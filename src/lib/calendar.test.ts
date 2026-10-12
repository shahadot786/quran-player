import { describe, expect, it } from "vitest";
import { activeDays, hijriParts, levelFor, monthColumns, ramadanEnd, yearMax, yearWeeks, yearsWithData } from "./calendar";

describe("yearWeeks", () => {
  it("covers every day of the year once, in Monday-first weeks", () => {
    for (const year of [2024, 2025, 2026]) {
      const weeks = yearWeeks(year);
      const days = weeks.flat().filter((cell) => cell !== null);
      expect(days).toHaveLength(year === 2024 ? 366 : 365);
      expect(new Set(days.map((cell) => cell!.key)).size).toBe(days.length);
      expect(weeks.every((week) => week.length === 7)).toBe(true);
      for (const week of weeks) {
        week.forEach((cell, index) => cell && expect((cell.date.getDay() + 6) % 7).toBe(index));
      }
    }
  });

  it("starts with 1 January and ends with 31 December", () => {
    const weeks = yearWeeks(2026);
    expect(weeks[0]!.find((cell) => cell)!.key).toBe("2026-01-01");
    expect(weeks.at(-1)!.findLast((cell) => cell)!.key).toBe("2026-12-31");
    expect(weeks.length).toBeGreaterThanOrEqual(53);
  });

  it("marks where each month starts", () => {
    const columns = monthColumns(yearWeeks(2026));
    expect(columns.map((entry) => entry.month)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(columns[0]!.column).toBe(0);
  });
});

describe("levelFor", () => {
  it("shows nothing for an empty day and four shades up to the busiest day", () => {
    expect(levelFor(0, 100)).toBe(0);
    expect(levelFor(1, 100)).toBe(1);
    expect(levelFor(25, 100)).toBe(1);
    expect(levelFor(26, 100)).toBe(2);
    expect(levelFor(75, 100)).toBe(3);
    expect(levelFor(100, 100)).toBe(4);
    expect(levelFor(5, 0)).toBe(0);
  });
});

describe("year figures", () => {
  const values = { "2025-12-31": 50, "2026-01-01": 10, "2026-03-04": 0, "2026-10-07": 90 };

  it("counts active days in a year or overall", () => {
    expect(activeDays(values, 2026)).toBe(2);
    expect(activeDays(values)).toBe(3);
  });

  it("finds the busiest day of a year", () => {
    expect(yearMax(values, 2026)).toBe(90);
    expect(yearMax(values, 2024)).toBe(0);
  });

  it("lists the years from the first with data to now, newest first", () => {
    expect(yearsWithData(Object.keys(values), 2026)).toEqual([2026, 2025]);
    expect(yearsWithData([], 2026)).toEqual([2026]);
  });
});

describe("hijriParts", () => {
  it("gives the Umm al-Qura date in both languages", () => {
    const date = new Date(2026, 9, 7, 12);
    expect(hijriParts(date, "en")).toEqual({ day: "26", month: "Rabiʻ II", year: "1448" });
    expect(hijriParts(date, "bn")).toEqual({ day: "২৬", month: "রবিউস সানি", year: "১৪৪৮" });
  });
});

describe("ramadanEnd", () => {
  it("finds the last day of the next Ramadan", () => {
    expect(ramadanEnd(new Date(2026, 9, 12))).toBe("2027-03-08");
  });

  it("finds the end of the Ramadan that has begun", () => {
    expect(ramadanEnd(new Date(2027, 1, 20))).toBe("2027-03-08");
  });

  it("moves to the following year once Ramadan is over", () => {
    expect(ramadanEnd(new Date(2027, 2, 9))!.startsWith("2028-02")).toBe(true);
  });
});
