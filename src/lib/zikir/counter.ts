import type { Run, RunRef, Step } from "./types";

export type CountResult = {
  /** The run afterwards; null once the round is finished. */
  run: Run | null;
  /** The item that received this count, or null when the run no longer matches its steps. */
  itemId: string | null;
  stepDone: boolean;
  roundDone: boolean;
  /** Counts made in this round so far, including this one. */
  total: number;
};

export type UndoResult = { run: Run; itemId: string };

export const startRun = (ref: RunRef, now: number): Run => ({ ...ref, step: 0, count: 0, startedAt: now, updatedAt: now });

// A saved run can outlive an edit to its group, so it is only trusted while it still fits.
export function isRunValid(run: Run, steps: Step[]): boolean {
  const step = steps[run.step];
  return Boolean(step) && run.count >= 0 && (step!.target === null || run.count < step!.target);
}

export function runTotal(run: Run, steps: Step[]): number {
  const before = steps.slice(0, run.step).reduce((sum, step) => sum + (step.target ?? 0), 0);
  return before + run.count;
}

export function count(run: Run, steps: Step[], now: number): CountResult {
  const step = steps[run.step];
  if (!step || !isRunValid(run, steps)) return { run, itemId: null, stepDone: false, roundDone: false, total: runTotal(run, steps) };

  const counted = run.count + 1;
  const total = runTotal(run, steps) + 1;
  if (step.target === null || counted < step.target) {
    return { run: { ...run, count: counted, updatedAt: now }, itemId: step.itemId, stepDone: false, roundDone: false, total };
  }
  if (run.step + 1 < steps.length) {
    return { run: { ...run, step: run.step + 1, count: 0, updatedAt: now }, itemId: step.itemId, stepDone: true, roundDone: false, total };
  }
  return { run: null, itemId: step.itemId, stepDone: true, roundDone: true, total };
}

export function undo(run: Run, steps: Step[], now: number): UndoResult | null {
  const current = steps[run.step];
  if (!current) return null;
  if (run.count > 0) return { run: { ...run, count: run.count - 1, updatedAt: now }, itemId: current.itemId };

  const previous = steps[run.step - 1];
  if (!previous || previous.target === null) return null;
  return { run: { ...run, step: run.step - 1, count: previous.target - 1, updatedAt: now }, itemId: previous.itemId };
}
