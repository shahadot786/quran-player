import type { Run } from "./types";

// What the screens show for an item or a group, whether it is built in or the user's own.
export type ItemView = {
  id: string;
  name: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number | null;
  dailyGoal: number | null;
  builtIn: boolean;
  /** Where a built-in zikir comes from, for grouping the library. */
  collection?: "hisn";
};

export type StepView = { itemId: string; name: string; target: number };

export type GroupView = {
  id: string;
  name: string;
  description: string;
  steps: StepView[];
  dailyGoal: number | null;
  builtIn: boolean;
  /** Counts in one full round. */
  total: number;
};

// How far a saved round has got, for the "in progress" label on a card.
export function runProgress(run: Run | undefined, view: { steps?: StepView[]; target?: number | null; total?: number }) {
  if (!run) return null;
  if (!view.steps) return run.count > 0 ? { done: run.count, total: view.target ?? null } : null;
  const done = view.steps.slice(0, run.step).reduce((sum, step) => sum + step.target, 0) + run.count;
  return done > 0 ? { done, total: view.total ?? null } : null;
}

// An item is counted as a one-step round, so the counter treats items and groups the same way.
export type CounterStep = { itemId: string; name: string; target: number | null };

export type CounterState = {
  stepIndex: number;
  step: CounterStep;
  /** Counts made in the current step. */
  count: number;
  /** Fill of the ring for the current step, or null when the step has no limit. */
  ratio: number | null;
  /** Counts made in the whole round so far. */
  done: number;
  /** Counts in a full round, or null when any step has no limit. */
  roundTotal: number | null;
  nextStep: CounterStep | null;
  canUndo: boolean;
};

export function counterState(run: Run | undefined, steps: CounterStep[]): CounterState {
  const stepIndex = run && run.step < steps.length ? run.step : 0;
  const step = steps[stepIndex]!;
  const count = run && run.step < steps.length ? run.count : 0;
  const earlier = steps.slice(0, stepIndex).reduce((sum, entry) => sum + (entry.target ?? 0), 0);
  const limited = steps.every((entry) => entry.target !== null);
  return {
    stepIndex,
    step,
    count,
    ratio: step.target === null ? null : Math.min(1, count / step.target),
    done: earlier + count,
    roundTotal: limited ? steps.reduce((sum, entry) => sum + (entry.target ?? 0), 0) : null,
    nextStep: steps[stepIndex + 1] ?? null,
    canUndo: stepIndex > 0 || count > 0,
  };
}
