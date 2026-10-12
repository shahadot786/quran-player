import { describe, expect, it } from "vitest";
import { activeGoals, addToCell, dayBreakdown, dayGoalProgress, dayTotal, dayTotals, itemDayTotal, lastCountAt, roundsOnDay, lastDaysTotals, lifetimeTotals, qualifiesForStreak, zikirStreaks, type Goal } from "./stats";
import type { Counts, HistoryEntry, ZikirGroup, ZikirItem } from "./types";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const TODAY = new Date(2026, 9, 8, 15);

function counted(entries: [string, string, string, number][]): Counts {
  return entries.reduce<Counts>((counts, [day, item, device, n]) => addToCell(counts, day, item, device, n, 1), {});
}

const round = (id: string, finishedAt: number, completed = true): HistoryEntry => ({ id, kind: "group", refId: "g", name: null, count: 100, finishedAt, completed });

describe("addToCell", () => {
  it("adds to one device's cell and leaves other devices alone", () => {
    const counts = counted([["2026-10-08", "a", "phone", 3], ["2026-10-08", "a", "laptop", 2]]);
    expect(counts["2026-10-08"]!.a).toEqual({ phone: { n: 3, at: 1 }, laptop: { n: 2, at: 1 } });
  });

  it("does not change the object it was given", () => {
    const before = counted([["2026-10-08", "a", "phone", 1]]);
    const snapshot = JSON.stringify(before);
    addToCell(before, "2026-10-08", "a", "phone", 1, 2);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("records when the cell was last written, for merging", () => {
    const counts = addToCell(counted([["2026-10-08", "a", "phone", 1]]), "2026-10-08", "a", "phone", 1, 99);
    expect(counts["2026-10-08"]!.a!.phone).toEqual({ n: 2, at: 99 });
  });

  it("never goes below zero", () => {
    const counts = addToCell({}, "2026-10-08", "a", "phone", -1, 5);
    expect(itemDayTotal(counts, "2026-10-08", "a")).toBe(0);
  });
});

describe("totals", () => {
  const counts = counted([
    ["2026-10-08", "a", "phone", 30],
    ["2026-10-08", "a", "laptop", 12],
    ["2026-10-08", "b", "phone", 5],
    ["2026-10-07", "a", "phone", 100],
  ]);

  it("adds up devices for an item and a day", () => {
    expect(itemDayTotal(counts, "2026-10-08", "a")).toBe(42);
    expect(itemDayTotal(counts, "2026-10-08", "zzz")).toBe(0);
    expect(itemDayTotal(counts, "2026-01-01", "a")).toBe(0);
  });

  it("adds up everything counted on a day", () => {
    expect(dayTotal(counts, "2026-10-08")).toBe(47);
    expect(dayTotal(counts, "2026-10-07")).toBe(100);
  });

  it("adds up a lifetime, overall and per item", () => {
    expect(lifetimeTotals(counts)).toEqual({ total: 147, byItem: { a: 142, b: 5 } });
    expect(lifetimeTotals({})).toEqual({ total: 0, byItem: {} });
  });

  it("lists the last days oldest first, ending today, with zeros for quiet days", () => {
    const days = lastDaysTotals(counts, 3, TODAY);
    expect(days.map((d) => d.total)).toEqual([0, 100, 47]);
    expect(days.at(-1)!.date.getDate()).toBe(8);
  });
});

describe("goals", () => {
  const counts = counted([["2026-10-08", "a", "phone", 40], ["2026-10-08", "b", "phone", 5]]);
  const goals: Goal[] = [
    { kind: "item", id: "a", target: 33 },
    { kind: "item", id: "b", target: 10 },
    { kind: "group", id: "g", target: 2 },
  ];
  const history = [round("1", at(2026, 10, 8)), round("2", at(2026, 10, 8, 20)), round("3", at(2026, 10, 7)), round("4", at(2026, 10, 8), false)];

  it("measures items by their counts and groups by finished rounds that day", () => {
    expect(dayGoalProgress("2026-10-08", goals, counts, history)).toEqual([
      { kind: "item", id: "a", done: 40, goal: 33, met: true },
      { kind: "item", id: "b", done: 5, goal: 10, met: false },
      { kind: "group", id: "g", done: 2, goal: 2, met: true },
    ]);
  });

  it("does not count rounds that were ended by hand", () => {
    expect(dayGoalProgress("2026-10-08", [goals[2]!], counts, [round("x", at(2026, 10, 8), false)])[0]).toMatchObject({ done: 0, met: false });
  });
});

describe("streaks", () => {
  const goals: Goal[] = [{ kind: "item", id: "a", target: 10 }];

  it("counts a day once any goal is met", () => {
    const counts = counted([["2026-10-08", "a", "p", 10], ["2026-10-07", "a", "p", 9]]);
    expect(qualifiesForStreak("2026-10-08", goals, counts, [])).toBe(true);
    expect(qualifiesForStreak("2026-10-07", goals, counts, [])).toBe(false);
  });

  it("counts any zikir on a day when no goal is set", () => {
    const counts = counted([["2026-10-08", "a", "p", 1]]);
    expect(qualifiesForStreak("2026-10-08", [], counts, [])).toBe(true);
    expect(qualifiesForStreak("2026-10-07", [], counts, [])).toBe(false);
  });

  it("finds the current and longest streak, across a month end", () => {
    const counts = counted([
      ["2026-09-29", "a", "p", 10],
      ["2026-09-30", "a", "p", 10],
      ["2026-10-01", "a", "p", 10],
      ["2026-10-05", "a", "p", 10],
      ["2026-10-07", "a", "p", 10],
      ["2026-10-08", "a", "p", 10],
    ]);
    expect(zikirStreaks(goals, counts, [], TODAY)).toEqual({ current: 2, longest: 3 });
  });

  it("keeps the streak alive until the day ends", () => {
    const counts = counted([["2026-10-06", "a", "p", 10], ["2026-10-07", "a", "p", 10], ["2026-10-08", "a", "p", 3]]);
    expect(zikirStreaks(goals, counts, [], TODAY)).toEqual({ current: 2, longest: 2 });
  });

  it("is zero without any activity", () => {
    expect(zikirStreaks([], {}, [], TODAY)).toEqual({ current: 0, longest: 0 });
  });

  it("counts a group's finished rounds toward the streak", () => {
    const groupGoals: Goal[] = [{ kind: "group", id: "g", target: 1 }];
    const history = [round("1", at(2026, 10, 7)), round("2", at(2026, 10, 8))];
    expect(zikirStreaks(groupGoals, {}, history, TODAY)).toEqual({ current: 2, longest: 2 });
  });
});

describe("activeGoals", () => {
  const item = (id: string, dailyGoal: number | null, deletedAt: number | null = null): ZikirItem => ({
    id, name: id, arabic: "", transliteration: "", meaning: "", target: 10, dailyGoal, createdAt: 1, updatedAt: 1, deletedAt,
  });
  const group = (id: string, dailyGoal: number | null, deletedAt: number | null = null): ZikirGroup => ({
    id, name: id, steps: [{ itemId: "a", target: 1 }], dailyGoal, createdAt: 1, updatedAt: 1, deletedAt,
  });

  it("lists the items and groups that have a goal and are not deleted", () => {
    expect(activeGoals({ items: [item("a", 100), item("b", null), item("c", 5, 9)], groups: [group("g", 2), group("h", null), group("i", 3, 9)] })).toEqual([
      { kind: "item", id: "a", target: 100 },
      { kind: "group", id: "g", target: 2 },
    ]);
  });

  it("is empty when nothing has a goal", () => {
    expect(activeGoals({ items: [item("a", null)], groups: [] })).toEqual([]);
  });
});

describe("day views", () => {
  const counts = counted([
    ["2026-10-07", "a", "phone", 10],
    ["2026-10-07", "a", "laptop", 5],
    ["2026-10-07", "b", "phone", 20],
    ["2026-10-07", "c", "phone", 0],
    ["2026-10-08", "a", "phone", 3],
  ]);

  it("totals every day", () => {
    expect(dayTotals(counts)).toEqual({ "2026-10-07": 35, "2026-10-08": 3 });
  });

  it("lists a day's zikir biggest first, adding up devices and leaving out zeros", () => {
    expect(dayBreakdown(counts, "2026-10-07")).toEqual([
      { itemId: "b", count: 20 },
      { itemId: "a", count: 15 },
    ]);
    expect(dayBreakdown(counts, "2026-01-01")).toEqual([]);
  });

  it("finds the rounds finished on a day, in order", () => {
    const history = [round("late", at(2026, 10, 7, 20)), round("other", at(2026, 10, 8, 9)), round("early", at(2026, 10, 7, 6))];
    expect(roundsOnDay(history, "2026-10-07").map((entry) => entry.id)).toEqual(["early", "late"]);
  });
});

describe("lastCountAt", () => {
  it("finds the latest count of a day across devices", () => {
    const counts = addToCell(addToCell(addToCell({}, "2026-10-12", "a", "phone", 1, 50), "2026-10-12", "b", "laptop", 2, 90), "2026-10-11", "a", "phone", 1, 99);
    expect(lastCountAt(counts, "2026-10-12")).toBe(90);
    expect(lastCountAt(counts, "2026-10-10")).toBeNull();
  });
});
