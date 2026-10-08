import { localDateKey } from "../format";
import { STREAK_MIN_SECONDS, computeStreaks, lastDays } from "../stats";
import type { Counts, HistoryEntry, RunKind, ZikirGroup, ZikirItem } from "./types";

export type Goal = { kind: RunKind; id: string; target: number };
export type GoalProgress = { kind: RunKind; id: string; done: number; goal: number; met: boolean };

export function activeGoals(source: { items: ZikirItem[]; groups: ZikirGroup[] }): Goal[] {
  const goals: Goal[] = [];
  for (const item of source.items) if (item.deletedAt === null && item.dailyGoal !== null) goals.push({ kind: "item", id: item.id, target: item.dailyGoal });
  for (const group of source.groups) if (group.deletedAt === null && group.dailyGoal !== null) goals.push({ kind: "group", id: group.id, target: group.dailyGoal });
  return goals;
}

const sumCells = (cells: Record<string, { n: number }> | undefined) => Object.values(cells ?? {}).reduce((sum, cell) => sum + cell.n, 0);

export function addToCell(counts: Counts, day: string, itemId: string, deviceId: string, delta: number, now: number): Counts {
  const cell = counts[day]?.[itemId]?.[deviceId];
  const next = { n: Math.max(0, (cell?.n ?? 0) + delta), at: now };
  return { ...counts, [day]: { ...counts[day], [itemId]: { ...counts[day]?.[itemId], [deviceId]: next } } };
}

export const itemDayTotal = (counts: Counts, day: string, itemId: string) => sumCells(counts[day]?.[itemId]);

export const dayTotal = (counts: Counts, day: string) => Object.values(counts[day] ?? {}).reduce((sum, cells) => sum + sumCells(cells), 0);

export function lifetimeTotals(counts: Counts) {
  const byItem: Record<string, number> = {};
  for (const items of Object.values(counts)) {
    for (const [itemId, cells] of Object.entries(items)) byItem[itemId] = (byItem[itemId] ?? 0) + sumCells(cells);
  }
  return { total: Object.values(byItem).reduce((sum, value) => sum + value, 0), byItem };
}

export function lastDaysTotals(counts: Counts, days = 7, today = new Date()) {
  const totals = Object.fromEntries(Object.keys(counts).map((day) => [day, dayTotal(counts, day)]));
  return lastDays(totals, days, today).map(({ date, seconds }) => ({ date, total: seconds }));
}

const finishedRounds = (history: HistoryEntry[], groupId: string, day: string) =>
  history.filter((entry) => entry.kind === "group" && entry.refId === groupId && entry.completed && localDateKey(new Date(entry.finishedAt)) === day).length;

export function dayGoalProgress(day: string, goals: Goal[], counts: Counts, history: HistoryEntry[]): GoalProgress[] {
  return goals.map(({ kind, id, target }) => {
    const done = kind === "item" ? itemDayTotal(counts, day, id) : finishedRounds(history, id, day);
    return { kind, id, done, goal: target, met: done >= target };
  });
}

// With goals set, a day counts once one is met; without any, a day counts once anything was counted.
export function qualifiesForStreak(day: string, goals: Goal[], counts: Counts, history: HistoryEntry[]) {
  if (goals.length === 0) return dayTotal(counts, day) > 0;
  return dayGoalProgress(day, goals, counts, history).some((progress) => progress.met);
}

export function zikirStreaks(goals: Goal[], counts: Counts, history: HistoryEntry[], today = new Date()) {
  const days = new Set([...Object.keys(counts), ...history.map((entry) => localDateKey(new Date(entry.finishedAt)))]);
  const daily = Object.fromEntries([...days].map((day) => [day, qualifiesForStreak(day, goals, counts, history) ? STREAK_MIN_SECONDS : 0]));
  return computeStreaks(daily, today);
}
