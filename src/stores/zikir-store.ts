import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getBuiltInGroup, getBuiltInItem, isBuiltIn } from "@/data/zikir-defaults";
import { getDeviceId } from "@/lib/device";
import { localDateKey } from "@/lib/format";
import { moveItem, omitKey } from "@/lib/utils";
import { count, isRunValid, runTotal, startRun, undo } from "@/lib/zikir/counter";
import { addToCell } from "@/lib/zikir/stats";
import type { Counts, GroupStep, HistoryEntry, Run, RunRef, Step, ZikirGroup, ZikirItem, ZikirSettings } from "@/lib/zikir/types";

export const HISTORY_LIMIT = 500;

export type ItemInput = Pick<ZikirItem, "name" | "arabic" | "transliteration" | "meaning" | "target" | "dailyGoal">;
export type GroupInput = Pick<ZikirGroup, "name" | "steps" | "dailyGoal">;
export type DeleteResult = { ok: true } | { ok: false; reason: "in-use"; groups: string[] };
export type TapResult = { stepDone: boolean; roundDone: boolean };

type ZikirData = {
  items: ZikirItem[];
  groups: ZikirGroup[];
  counts: Counts;
  /** Rounds in progress, by `item:<id>` or `group:<id>`; they live only on this device. */
  runs: Record<string, Run>;
  history: HistoryEntry[];
  /** Built-in items and groups the user has removed; each entry records when, so a later sync can tell removed from restored. */
  builtIns: Record<string, { removed: boolean; at: number }>;
  settings: ZikirSettings;
};

export type ZikirSnapshot = Pick<ZikirData, "items" | "groups" | "counts" | "history" | "builtIns">;

type ZikirState = ZikirData & {
  createItem: (input: ItemInput, now?: number) => string;
  updateItem: (id: string, patch: Partial<ItemInput>, now?: number) => void;
  deleteItem: (id: string, now?: number) => DeleteResult;
  createGroup: (input: GroupInput, now?: number) => string;
  updateGroup: (id: string, patch: Partial<GroupInput>, now?: number) => void;
  moveStep: (groupId: string, from: number, to: number, now?: number) => void;
  deleteGroup: (id: string, now?: number) => void;
  restoreBuiltIns: (now?: number) => void;
  clearHistory: () => void;
  /** Replaces the saved data with a snapshot. Rounds in progress and the view, sound and vibration choices belong to this device and stay out of it; rounds are dropped unless `keepRuns` is set, as a sync does. */
  restore: (snapshot: ZikirSnapshot, options?: { keepRuns?: boolean }) => void;
  tap: (ref: RunRef, now?: number) => TapResult | null;
  undo: (ref: RunRef, now?: number) => boolean;
  resetRun: (ref: RunRef) => void;
  finishRun: (ref: RunRef, now?: number) => boolean;
  setSettings: (patch: Partial<ZikirSettings>) => void;
  reset: () => void;
};

const EMPTY: Omit<ZikirData, "settings"> = { items: [], groups: [], counts: {}, runs: {}, history: [], builtIns: {} };
const DEFAULT_SETTINGS: ZikirSettings = { view: "beads", sound: true, haptics: true, keepAwake: false };

export const runKey = (ref: RunRef) => `${ref.kind}:${ref.id}`;
const whole = (value: number) => Math.max(1, Math.floor(value));
const target = (value: number | null) => (value === null ? null : whole(value));
const touch = <T extends { id: string; updatedAt: number }>(list: T[], id: string, change: Partial<T>, now: number) =>
  list.map((entry) => (entry.id === id ? { ...entry, ...change, updatedAt: now } : entry));
const cleanSteps = (steps: GroupStep[]) => steps.map((step) => ({ itemId: step.itemId, target: whole(step.target) }));

type Source = Pick<ZikirData, "items" | "groups" | "builtIns">;

export const isBuiltInRemoved = (state: Pick<ZikirData, "builtIns">, id: string) => state.builtIns[id]?.removed === true;

const liveItem = (state: Source, id: string) => state.items.find((item) => item.id === id && item.deletedAt === null);
const liveGroup = (state: Source, id: string) => state.groups.find((group) => group.id === id && group.deletedAt === null);

// The counting steps for a round, or null when what it refers to is gone.
export function stepsFor(state: Source, ref: RunRef): Step[] | null {
  if (isBuiltInRemoved(state, ref.id)) return null;
  if (ref.kind === "item") {
    const item = getBuiltInItem(ref.id) ?? liveItem(state, ref.id);
    return item ? [{ itemId: ref.id, target: item.target }] : null;
  }
  const builtIn = getBuiltInGroup(ref.id);
  const steps = builtIn?.steps ?? liveGroup(state, ref.id)?.steps;
  if (!steps || steps.length === 0) return null;
  const complete = steps.every((step) => (getBuiltInItem(step.itemId) ?? liveItem(state, step.itemId)) !== undefined);
  return complete ? steps.map((step) => ({ itemId: step.itemId, target: step.target })) : null;
}

// Built-in names come from the translations, so only custom ones are stored with a round.
const nameOf = (state: Source, ref: RunRef) =>
  isBuiltIn(ref.id) ? null : ((ref.kind === "item" ? state.items : state.groups).find((entry) => entry.id === ref.id)?.name ?? null);

function finished(state: ZikirData, ref: RunRef, total: number, completed: boolean, now: number): HistoryEntry[] {
  const entry: HistoryEntry = { id: crypto.randomUUID(), kind: ref.kind, refId: ref.id, name: nameOf(state, ref), count: total, finishedAt: now, completed };
  return [entry, ...state.history].slice(0, HISTORY_LIMIT);
}

export const useZikirStore = create<ZikirState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      settings: DEFAULT_SETTINGS,

      createItem: (input, now = Date.now()) => {
        const id = crypto.randomUUID();
        const item: ZikirItem = {
          id,
          name: input.name.trim(),
          arabic: input.arabic.trim(),
          transliteration: input.transliteration.trim(),
          meaning: input.meaning.trim(),
          target: target(input.target),
          dailyGoal: target(input.dailyGoal),
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        set((s) => ({ items: [...s.items, item] }));
        return id;
      },

      updateItem: (id, patch, now = Date.now()) =>
        set((s) => {
          const change: Partial<ZikirItem> = {};
          if (patch.name !== undefined) change.name = patch.name.trim();
          if (patch.arabic !== undefined) change.arabic = patch.arabic.trim();
          if (patch.transliteration !== undefined) change.transliteration = patch.transliteration.trim();
          if (patch.meaning !== undefined) change.meaning = patch.meaning.trim();
          if (patch.target !== undefined) change.target = target(patch.target);
          if (patch.dailyGoal !== undefined) change.dailyGoal = target(patch.dailyGoal);
          return { items: touch(s.items, id, change, now) };
        }),

      deleteItem: (id, now = Date.now()) => {
        const using = get().groups.filter((group) => group.deletedAt === null && group.steps.some((step) => step.itemId === id));
        if (using.length > 0) return { ok: false, reason: "in-use", groups: using.map((group) => group.name) };
        set((s) => ({
          items: isBuiltIn(id) ? s.items : touch(s.items, id, { deletedAt: now }, now),
          builtIns: isBuiltIn(id) ? { ...s.builtIns, [id]: { removed: true, at: now } } : s.builtIns,
          runs: omitKey(s.runs, runKey({ kind: "item", id })),
        }));
        return { ok: true };
      },

      createGroup: (input, now = Date.now()) => {
        const id = crypto.randomUUID();
        const group: ZikirGroup = {
          id,
          name: input.name.trim(),
          steps: cleanSteps(input.steps),
          dailyGoal: target(input.dailyGoal),
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        set((s) => ({ groups: [...s.groups, group] }));
        return id;
      },

      updateGroup: (id, patch, now = Date.now()) =>
        set((s) => {
          const change: Partial<ZikirGroup> = {};
          if (patch.name !== undefined) change.name = patch.name.trim();
          if (patch.steps !== undefined) change.steps = cleanSteps(patch.steps);
          if (patch.dailyGoal !== undefined) change.dailyGoal = target(patch.dailyGoal);
          return { groups: touch(s.groups, id, change, now) };
        }),

      moveStep: (groupId, from, to, now = Date.now()) =>
        set((s) => ({ groups: s.groups.map((group) => (group.id === groupId ? { ...group, steps: moveItem(group.steps, from, to), updatedAt: now } : group)) })),

      deleteGroup: (id, now = Date.now()) =>
        set((s) => ({
          groups: isBuiltIn(id) ? s.groups : touch(s.groups, id, { deletedAt: now }, now),
          builtIns: isBuiltIn(id) ? { ...s.builtIns, [id]: { removed: true, at: now } } : s.builtIns,
          runs: omitKey(s.runs, runKey({ kind: "group", id })),
        })),

      restoreBuiltIns: (now = Date.now()) =>
        set((s) => {
          const removed = Object.entries(s.builtIns).filter(([, state]) => state.removed);
          if (removed.length === 0) return s;
          return { builtIns: { ...s.builtIns, ...Object.fromEntries(removed.map(([id]) => [id, { removed: false, at: now }])) } };
        }),

      tap: (ref, now = Date.now()) => {
        const state = get();
        const steps = stepsFor(state, ref);
        if (!steps) return null;
        const key = runKey(ref);
        const saved = state.runs[key];
        const result = count(saved && isRunValid(saved, steps) ? saved : startRun(ref, now), steps, now);
        if (!result.itemId) return null;

        set((s) => ({
          counts: addToCell(s.counts, localDateKey(new Date(now)), result.itemId!, getDeviceId(), 1, now),
          runs: result.run ? { ...s.runs, [key]: result.run } : omitKey(s.runs, key),
          history: result.roundDone ? finished(s, ref, result.total, true, now) : s.history,
        }));
        return { stepDone: result.stepDone, roundDone: result.roundDone };
      },

      undo: (ref, now = Date.now()) => {
        const state = get();
        const steps = stepsFor(state, ref);
        const run = state.runs[runKey(ref)];
        const undone = steps && run ? undo(run, steps, now) : null;
        if (!undone) return false;
        set((s) => ({
          counts: addToCell(s.counts, localDateKey(new Date(now)), undone.itemId, getDeviceId(), -1, now),
          runs: { ...s.runs, [runKey(ref)]: undone.run },
        }));
        return true;
      },

      resetRun: (ref) => set((s) => ({ runs: omitKey(s.runs, runKey(ref)) })),

      finishRun: (ref, now = Date.now()) => {
        const state = get();
        const steps = stepsFor(state, ref);
        const run = state.runs[runKey(ref)];
        const total = steps && run ? runTotal(run, steps) : 0;
        if (!run || total === 0) return false;
        set((s) => ({ runs: omitKey(s.runs, runKey(ref)), history: finished(s, ref, total, false, now) }));
        return true;
      },

      clearHistory: () => set({ history: [] }),

      restore: (snapshot, options) => set(options?.keepRuns ? { ...snapshot } : { ...snapshot, runs: {} }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      reset: () => set({ ...EMPTY }),
    }),
    { name: "qp-zikir", version: 1, skipHydration: true },
  ),
);
