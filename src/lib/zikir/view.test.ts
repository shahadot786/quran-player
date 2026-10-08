import { describe, expect, it } from "vitest";
import type { Run } from "./types";
import { counterState, runProgress, type CounterStep, type StepView } from "./view";

const run = (step: number, count: number): Run => ({ kind: "group", id: "g", step, count, startedAt: 0, updatedAt: 0 });
const steps: StepView[] = [
  { itemId: "a", name: "A", target: 33 },
  { itemId: "b", name: "B", target: 33 },
  { itemId: "c", name: "C", target: 34 },
];

describe("runProgress", () => {
  it("has nothing to show without a round, or one that has not counted yet", () => {
    expect(runProgress(undefined, { target: 10 })).toBeNull();
    expect(runProgress(run(0, 0), { steps, total: 100 })).toBeNull();
    expect(runProgress({ ...run(0, 0), kind: "item" }, { target: 10 })).toBeNull();
  });

  it("shows an item's count against its target, or alone when it has none", () => {
    expect(runProgress({ ...run(0, 4), kind: "item" }, { target: 10 })).toEqual({ done: 4, total: 10 });
    expect(runProgress({ ...run(0, 4), kind: "item" }, { target: null })).toEqual({ done: 4, total: null });
  });

  it("adds up earlier steps for a group", () => {
    expect(runProgress(run(1, 5), { steps, total: 100 })).toEqual({ done: 38, total: 100 });
    expect(runProgress(run(2, 0), { steps, total: 100 })).toEqual({ done: 66, total: 100 });
  });
});

describe("counterState", () => {
  const items: CounterStep[] = [
    { itemId: "a", name: "A", target: 33 },
    { itemId: "b", name: "B", target: 33 },
    { itemId: "c", name: "C", target: 34 },
  ];

  it("starts at the first step with nothing counted", () => {
    expect(counterState(undefined, items)).toMatchObject({ stepIndex: 0, count: 0, ratio: 0, done: 0, roundTotal: 100, canUndo: false, nextStep: items[1] });
  });

  it("follows a round through its steps", () => {
    const state = counterState({ ...run(1, 11), kind: "group" }, items);
    expect(state).toMatchObject({ stepIndex: 1, count: 11, done: 44, nextStep: items[2], canUndo: true });
    expect(state.ratio).toBeCloseTo(1 / 3, 6);
    expect(state.step.name).toBe("B");
  });

  it("has no next step on the last one", () => {
    expect(counterState(run(2, 3), items).nextStep).toBeNull();
  });

  it("can undo at the start of a later step even with no count in it", () => {
    expect(counterState(run(1, 0), items).canUndo).toBe(true);
  });

  it("has no ring fill or round total when a step has no limit", () => {
    const free: CounterStep[] = [{ itemId: "a", name: "A", target: null }];
    expect(counterState({ ...run(0, 12), kind: "item" }, free)).toMatchObject({ ratio: null, count: 12, done: 12, roundTotal: null, canUndo: true });
  });

  it("falls back to the start when a saved round no longer fits its steps", () => {
    expect(counterState(run(9, 4), items)).toMatchObject({ stepIndex: 0, count: 0, canUndo: false });
  });
});
