import { describe, expect, it } from "vitest";
import { count, isRunValid, runTotal, startRun, undo } from "./counter";
import type { Run, Step } from "./types";

const NOW = 1000;
const single: Step[] = [{ itemId: "a", target: 3 }];
const group: Step[] = [
  { itemId: "a", target: 2 },
  { itemId: "b", target: 3 },
  { itemId: "c", target: 1 },
];
const begin = () => startRun({ kind: "group", id: "g" }, NOW);

function tap(run: Run, steps: Step[], times: number) {
  let current: Run | null = run;
  const results = [];
  for (let i = 0; i < times; i += 1) {
    const result = count(current!, steps, NOW + i);
    results.push(result);
    current = result.run;
  }
  return { run: current, results };
}

describe("startRun", () => {
  it("begins at the first step with nothing counted", () => {
    expect(startRun({ kind: "item", id: "a" }, 5)).toEqual({ kind: "item", id: "a", step: 0, count: 0, startedAt: 5, updatedAt: 5 });
  });
});

describe("count", () => {
  it("adds one to the current step and reports which item was counted", () => {
    const result = count(startRun({ kind: "item", id: "a" }, NOW), single, NOW + 1);
    expect(result).toMatchObject({ itemId: "a", stepDone: false, roundDone: false, total: 1 });
    expect(result.run).toMatchObject({ count: 1, step: 0, updatedAt: NOW + 1 });
  });

  it("finishes the round on reaching the target of the only step", () => {
    const { results } = tap(startRun({ kind: "item", id: "a" }, NOW), single, 3);
    expect(results.map((r) => r.roundDone)).toEqual([false, false, true]);
    expect(results[2]).toMatchObject({ run: null, stepDone: true, total: 3 });
  });

  it("moves to the next step when a step is reached, and keeps going", () => {
    const { results, run } = tap(begin(), group, 3);
    expect(results.map((r) => r.itemId)).toEqual(["a", "a", "b"]);
    expect(results[1]).toMatchObject({ stepDone: true, roundDone: false });
    expect(run).toMatchObject({ step: 1, count: 1 });
  });

  it("finishes a group only after its last step", () => {
    const { results } = tap(begin(), group, 6);
    expect(results.map((r) => r.roundDone)).toEqual([false, false, false, false, false, true]);
    expect(results.at(-1)).toMatchObject({ run: null, itemId: "c", total: 6 });
  });

  it("never finishes when there is no target", () => {
    const { run, results } = tap(startRun({ kind: "item", id: "a" }, NOW), [{ itemId: "a", target: null }], 500);
    expect(results.some((r) => r.roundDone)).toBe(false);
    expect(run).toMatchObject({ count: 500 });
  });

  it("does nothing for a run that no longer matches its steps", () => {
    const stale = { ...begin(), step: 7 };
    expect(count(stale, group, NOW)).toMatchObject({ run: stale, itemId: null, stepDone: false, roundDone: false });
    expect(count(begin(), [], NOW).itemId).toBeNull();
  });
});

describe("undo", () => {
  it("takes back the last count in a step", () => {
    const { run } = tap(begin(), group, 1);
    const undone = undo(run!, group, NOW);
    expect(undone).toMatchObject({ itemId: "a", run: { step: 0, count: 0 } });
  });

  it("goes back across a step boundary to the count that finished the earlier step", () => {
    const { run } = tap(begin(), group, 2);
    expect(run).toMatchObject({ step: 1, count: 0 });
    const undone = undo(run!, group, NOW);
    expect(undone).toMatchObject({ itemId: "a", run: { step: 0, count: 1 } });
  });

  it("has nothing to undo at the very start", () => {
    expect(undo(begin(), group, NOW)).toBeNull();
  });

  it("is the exact inverse of counting", () => {
    const { run } = tap(begin(), group, 4);
    let current = run!;
    const items: (string | null)[] = [];
    for (let i = 0; i < 4; i += 1) {
      const undone = undo(current, group, NOW)!;
      items.push(undone.itemId);
      current = undone.run;
    }
    expect(items).toEqual(["b", "b", "a", "a"]);
    expect(current).toMatchObject({ step: 0, count: 0 });
  });
});

describe("runTotal and isRunValid", () => {
  it("adds up earlier steps and the current count", () => {
    expect(runTotal({ ...begin(), step: 0, count: 1 }, group)).toBe(1);
    expect(runTotal({ ...begin(), step: 1, count: 2 }, group)).toBe(4);
    expect(runTotal({ ...begin(), step: 2, count: 0 }, group)).toBe(5);
  });

  it("flags runs that point outside their steps", () => {
    expect(isRunValid(begin(), group)).toBe(true);
    expect(isRunValid({ ...begin(), step: 3 }, group)).toBe(false);
    expect(isRunValid({ ...begin(), count: -1 }, group)).toBe(false);
    expect(isRunValid({ ...begin(), count: 2 }, group)).toBe(false);
    expect(isRunValid(begin(), [])).toBe(false);
  });
});
