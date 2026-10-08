import { beforeEach, describe, expect, it } from "vitest";
import { DEVICE_KEY } from "@/lib/device";
import { dayTotal, itemDayTotal } from "@/lib/zikir/stats";
import { isBuiltInRemoved, stepsFor, useZikirStore, type ZikirSnapshot } from "./zikir-store";

const zikir = () => useZikirStore.getState();
const DAY = new Date(2026, 9, 8, 10).getTime();
const NEXT_DAY = new Date(2026, 9, 9, 10).getTime();
const TODAY = "2026-10-08";

const itemInput = (overrides = {}) => ({ name: "My zikir", arabic: "", transliteration: "", meaning: "", target: 3, dailyGoal: null, ...overrides });
const item = (id: string) => zikir().items.find((entry) => entry.id === id);
const taps = (ref: { kind: "item" | "group"; id: string }, times: number, now = DAY) => {
  for (let i = 0; i < times; i += 1) zikir().tap(ref, now + i);
};

beforeEach(() => {
  localStorage.setItem(DEVICE_KEY, "phone");
  useZikirStore.setState(useZikirStore.getInitialState(), true);
});

describe("items", () => {
  it("creates an item with trimmed text and a sane target", () => {
    const id = zikir().createItem(itemInput({ name: "  Morning  ", target: 2.7 }), DAY);
    expect(item(id)).toMatchObject({ name: "Morning", target: 2, dailyGoal: null, createdAt: DAY, updatedAt: DAY, deletedAt: null });
  });

  it("keeps null as no limit and rejects targets below one", () => {
    expect(item(zikir().createItem(itemInput({ target: null })))!.target).toBeNull();
    expect(item(zikir().createItem(itemInput({ target: 0 })))!.target).toBe(1);
  });

  it("updates fields and the time it was updated", () => {
    const id = zikir().createItem(itemInput(), DAY);
    zikir().updateItem(id, { name: "Renamed", target: 10 }, DAY + 5);
    expect(item(id)).toMatchObject({ name: "Renamed", target: 10, createdAt: DAY, updatedAt: DAY + 5 });
  });

  it("removes an item but keeps a marker so a later sync can't bring it back", () => {
    const id = zikir().createItem(itemInput(), DAY);
    expect(zikir().deleteItem(id, DAY + 1)).toEqual({ ok: true });
    expect(item(id)).toMatchObject({ deletedAt: DAY + 1 });
    expect(zikir().tap({ kind: "item", id })).toBeNull();
  });

  it("refuses to delete an item a group still uses, and says which groups", () => {
    const id = zikir().createItem(itemInput());
    zikir().createGroup({ name: "Evening", steps: [{ itemId: id, target: 2 }], dailyGoal: null });
    zikir().createGroup({ name: "Other", steps: [{ itemId: id, target: 1 }], dailyGoal: null });
    expect(zikir().deleteItem(id)).toEqual({ ok: false, reason: "in-use", groups: ["Evening", "Other"] });
    expect(item(id)!.deletedAt).toBeNull();
  });

  it("allows deleting an item once the group using it is gone", () => {
    const id = zikir().createItem(itemInput());
    const group = zikir().createGroup({ name: "Evening", steps: [{ itemId: id, target: 2 }], dailyGoal: null });
    zikir().deleteGroup(group);
    expect(zikir().deleteItem(id)).toEqual({ ok: true });
  });

});

describe("deleting built-in zikir", () => {
  const ref = { kind: "item", id: "builtin:subhanAllah" } as const;

  it("hides a built-in zikir instead of destroying it, and stops it being counted", () => {
    taps(ref, 2);
    expect(zikir().deleteItem(ref.id, DAY + 9)).toEqual({ ok: true });
    expect(zikir().builtIns[ref.id]).toEqual({ removed: true, at: DAY + 9 });
    expect(isBuiltInRemoved(zikir(), ref.id)).toBe(true);
    expect(zikir().runs["item:builtin:subhanAllah"]).toBeUndefined();
    expect(zikir().tap(ref)).toBeNull();
    expect(itemDayTotal(zikir().counts, TODAY, ref.id)).toBe(2);
  });

  it("hides a built-in group", () => {
    zikir().deleteGroup("builtin:afterSalah", DAY);
    expect(isBuiltInRemoved(zikir(), "builtin:afterSalah")).toBe(true);
    expect(stepsFor(zikir(), { kind: "group", id: "builtin:afterSalah" })).toBeNull();
  });

  it("keeps a removed built-in zikir working inside a group of the user's own", () => {
    const group = zikir().createGroup({ name: "Mine", steps: [{ itemId: "builtin:subhanAllah", target: 2 }], dailyGoal: null });
    expect(zikir().deleteItem("builtin:subhanAllah")).toEqual({ ok: false, reason: "in-use", groups: ["Mine"] });
    zikir().deleteGroup(group);
    expect(zikir().deleteItem("builtin:subhanAllah")).toEqual({ ok: true });
  });

  it("keeps a group of the user's own working after the built-in group it was copied from is removed", () => {
    const group = zikir().createGroup({ name: "Mine", steps: [{ itemId: "builtin:alhamdulillah", target: 1 }], dailyGoal: null });
    zikir().deleteGroup("builtin:afterSalah");
    expect(zikir().tap({ kind: "group", id: group })).toMatchObject({ roundDone: true });
  });

  it("restores everything that was removed, leaving what was not", () => {
    zikir().deleteItem("builtin:subhanAllah", DAY);
    zikir().deleteGroup("builtin:afterSalah", DAY);
    zikir().restoreBuiltIns(DAY + 5);
    expect(isBuiltInRemoved(zikir(), "builtin:subhanAllah")).toBe(false);
    expect(isBuiltInRemoved(zikir(), "builtin:afterSalah")).toBe(false);
    expect(zikir().builtIns["builtin:subhanAllah"]).toEqual({ removed: false, at: DAY + 5 });
    expect(zikir().tap({ kind: "item", id: "builtin:subhanAllah" })).not.toBeNull();
  });

  it("does nothing when asked to restore with nothing removed", () => {
    const before = zikir().builtIns;
    zikir().restoreBuiltIns(DAY);
    expect(zikir().builtIns).toBe(before);
  });

  it("is cleared by a full reset", () => {
    zikir().deleteItem("builtin:subhanAllah");
    zikir().reset();
    expect(zikir().builtIns).toEqual({});
  });
});

describe("groups", () => {
  it("creates a group with steps of at least one", () => {
    const a = zikir().createItem(itemInput());
    const id = zikir().createGroup({ name: " After ", steps: [{ itemId: a, target: 0 }, { itemId: "builtin:allahuAkbar", target: 34 }], dailyGoal: 2 }, DAY);
    expect(zikir().groups.find((g) => g.id === id)).toMatchObject({
      name: "After",
      dailyGoal: 2,
      steps: [{ itemId: a, target: 1 }, { itemId: "builtin:allahuAkbar", target: 34 }],
    });
  });

  it("can reorder, update and delete", () => {
    const id = zikir().createGroup({ name: "G", steps: [{ itemId: "builtin:subhanAllah", target: 1 }, { itemId: "builtin:alhamdulillah", target: 2 }], dailyGoal: null });
    zikir().moveStep(id, 0, 1);
    expect(zikir().groups[0]!.steps.map((s) => s.itemId)).toEqual(["builtin:alhamdulillah", "builtin:subhanAllah"]);
    zikir().updateGroup(id, { name: "Renamed" }, DAY);
    expect(zikir().groups[0]).toMatchObject({ name: "Renamed", updatedAt: DAY });
    zikir().deleteGroup(id, DAY + 1);
    expect(zikir().groups[0]!.deletedAt).toBe(DAY + 1);
  });
});

describe("stepsFor", () => {
  it("resolves built-in and custom items and groups, and nothing else", () => {
    const id = zikir().createItem(itemInput({ target: 7 }));
    const state = zikir();
    expect(stepsFor(state, { kind: "item", id: "builtin:subhanAllah" })).toEqual([{ itemId: "builtin:subhanAllah", target: 33 }]);
    expect(stepsFor(state, { kind: "item", id })).toEqual([{ itemId: id, target: 7 }]);
    expect(stepsFor(state, { kind: "group", id: "builtin:afterSalah" })).toHaveLength(3);
    expect(stepsFor(state, { kind: "item", id: "missing" })).toBeNull();
    expect(stepsFor(state, { kind: "group", id: "missing" })).toBeNull();
  });
});

describe("tap", () => {
  it("counts for the item, the day and this device", () => {
    const id = zikir().createItem(itemInput({ target: 5 }));
    taps({ kind: "item", id }, 2);
    expect(zikir().counts[TODAY]![id]).toEqual({ phone: { n: 2, at: DAY + 1 } });
    expect(zikir().runs[`item:${id}`]).toMatchObject({ step: 0, count: 2 });
  });

  it("finishes a round at the target, records it and clears the run", () => {
    const id = zikir().createItem(itemInput({ name: "Mine", target: 3 }));
    const results = [1, 2, 3].map((i) => zikir().tap({ kind: "item", id }, DAY + i));
    expect(results.map((r) => r!.roundDone)).toEqual([false, false, true]);
    expect(zikir().runs[`item:${id}`]).toBeUndefined();
    expect(zikir().history).toHaveLength(1);
    expect(zikir().history[0]).toMatchObject({ kind: "item", refId: id, name: "Mine", count: 3, finishedAt: DAY + 3, completed: true });
    expect(itemDayTotal(zikir().counts, TODAY, id)).toBe(3);
  });

  it("starts a fresh round after finishing", () => {
    const id = zikir().createItem(itemInput({ target: 2 }));
    taps({ kind: "item", id }, 3);
    expect(zikir().runs[`item:${id}`]).toMatchObject({ count: 1 });
    expect(zikir().history).toHaveLength(1);
  });

  it("moves through a built-in group, crediting each item, and finishes after the last step", () => {
    const ref = { kind: "group", id: "builtin:afterSalah" } as const;
    taps(ref, 33);
    expect(zikir().runs["group:builtin:afterSalah"]).toMatchObject({ step: 1, count: 0 });
    taps(ref, 33, DAY + 100);
    taps(ref, 34, DAY + 200);
    expect(zikir().runs["group:builtin:afterSalah"]).toBeUndefined();
    expect(itemDayTotal(zikir().counts, TODAY, "builtin:subhanAllah")).toBe(33);
    expect(itemDayTotal(zikir().counts, TODAY, "builtin:alhamdulillah")).toBe(33);
    expect(itemDayTotal(zikir().counts, TODAY, "builtin:allahuAkbar")).toBe(34);
    expect(zikir().history[0]).toMatchObject({ kind: "group", refId: "builtin:afterSalah", name: null, count: 100, completed: true });
  });

  it("files counts under the day they were made", () => {
    const id = zikir().createItem(itemInput({ target: 10 }));
    taps({ kind: "item", id }, 2, DAY);
    taps({ kind: "item", id }, 3, NEXT_DAY);
    expect(itemDayTotal(zikir().counts, "2026-10-08", id)).toBe(2);
    expect(itemDayTotal(zikir().counts, "2026-10-09", id)).toBe(3);
    expect(dayTotal(zikir().counts, "2026-10-09")).toBe(3);
  });

  it("returns null for something that does not exist", () => {
    expect(zikir().tap({ kind: "item", id: "nope" })).toBeNull();
    expect(zikir().tap({ kind: "group", id: "nope" })).toBeNull();
    expect(zikir().counts).toEqual({});
  });

  it("starts over when an edit makes a saved round impossible", () => {
    const id = zikir().createItem(itemInput({ target: 10 }));
    taps({ kind: "item", id }, 8);
    zikir().updateItem(id, { target: 5 });
    zikir().tap({ kind: "item", id }, DAY + 50);
    expect(zikir().runs[`item:${id}`]).toMatchObject({ count: 1 });
  });

  it("keeps counting an item with no limit and never finishes by itself", () => {
    const id = zikir().createItem(itemInput({ target: null }));
    taps({ kind: "item", id }, 200);
    expect(zikir().runs[`item:${id}`]).toMatchObject({ count: 200 });
    expect(zikir().history).toEqual([]);
  });
});

describe("undo, reset and finish", () => {
  it("takes back the last count and the day's total with it", () => {
    const id = zikir().createItem(itemInput({ target: 5 }));
    taps({ kind: "item", id }, 3);
    expect(zikir().undo({ kind: "item", id }, DAY + 10)).toBe(true);
    expect(zikir().runs[`item:${id}`]).toMatchObject({ count: 2 });
    expect(itemDayTotal(zikir().counts, TODAY, id)).toBe(2);
  });

  it("goes back across a step of a group", () => {
    const ref = { kind: "group", id: "builtin:afterSalah" } as const;
    taps(ref, 34);
    expect(zikir().runs["group:builtin:afterSalah"]).toMatchObject({ step: 1, count: 1 });
    zikir().undo(ref);
    zikir().undo(ref);
    expect(zikir().runs["group:builtin:afterSalah"]).toMatchObject({ step: 0, count: 32 });
    expect(itemDayTotal(zikir().counts, TODAY, "builtin:alhamdulillah")).toBe(0);
  });

  it("has nothing to undo with no round going", () => {
    const id = zikir().createItem(itemInput());
    expect(zikir().undo({ kind: "item", id })).toBe(false);
  });

  it("never lets a day's total go below zero", () => {
    const id = zikir().createItem(itemInput({ target: 5 }));
    taps({ kind: "item", id }, 2, DAY);
    zikir().undo({ kind: "item", id }, NEXT_DAY);
    expect(itemDayTotal(zikir().counts, "2026-10-09", id)).toBe(0);
    expect(itemDayTotal(zikir().counts, "2026-10-08", id)).toBe(2);
  });

  it("restarts a round without taking away what was already counted", () => {
    const id = zikir().createItem(itemInput({ target: 5 }));
    taps({ kind: "item", id }, 3);
    zikir().resetRun({ kind: "item", id });
    expect(zikir().runs[`item:${id}`]).toBeUndefined();
    expect(itemDayTotal(zikir().counts, TODAY, id)).toBe(3);
  });

  it("ends a round by hand and records it as unfinished", () => {
    const id = zikir().createItem(itemInput({ name: "Free", target: null }));
    taps({ kind: "item", id }, 12);
    expect(zikir().finishRun({ kind: "item", id }, DAY + 99)).toBe(true);
    expect(zikir().runs[`item:${id}`]).toBeUndefined();
    expect(zikir().history[0]).toMatchObject({ refId: id, count: 12, completed: false, finishedAt: DAY + 99 });
    expect(zikir().finishRun({ kind: "item", id })).toBe(false);
  });

  it("keeps the newest history first and a bounded amount of it", () => {
    const id = zikir().createItem(itemInput({ target: 1 }));
    for (let i = 0; i < 520; i += 1) zikir().tap({ kind: "item", id }, DAY + i);
    expect(zikir().history).toHaveLength(500);
    expect(zikir().history[0]!.finishedAt).toBe(DAY + 519);
  });
});

describe("settings and reset", () => {
  it("starts with the bead string, sound and vibration on, and the screen free to sleep", () => {
    expect(zikir().settings).toEqual({ view: "beads", sound: true, haptics: true, keepAwake: false });
  });

  it("updates settings", () => {
    zikir().setSettings({ view: "dial", sound: false });
    expect(zikir().settings).toMatchObject({ view: "dial", sound: false, haptics: true });
  });

  it("clears everything but settings on reset", () => {
    const id = zikir().createItem(itemInput({ target: 1 }));
    taps({ kind: "item", id }, 2);
    zikir().setSettings({ view: "dial" });
    zikir().reset();
    expect(zikir()).toMatchObject({ items: [], groups: [], counts: {}, runs: {}, history: [] });
    expect(zikir().settings.view).toBe("dial");
  });
});

describe("history and restoring", () => {
  it("clears the list of finished rounds and nothing else", () => {
    const id = zikir().createItem(itemInput({ target: 1 }));
    taps({ kind: "item", id }, 2);
    zikir().clearHistory();
    expect(zikir().history).toEqual([]);
    expect(itemDayTotal(zikir().counts, TODAY, id)).toBe(2);
    expect(zikir().items).toHaveLength(1);
  });

  const snapshot: ZikirSnapshot = {
    items: [{ id: "kept", name: "Kept", arabic: "", transliteration: "", meaning: "", target: 5, dailyGoal: null, createdAt: 1, updatedAt: 1, deletedAt: null }],
    groups: [],
    counts: { "2026-10-01": { kept: { other: { n: 7, at: 5 } } } },
    history: [{ id: "h", kind: "item", refId: "kept", name: "Kept", count: 5, finishedAt: 9, completed: true }],
    builtIns: { "builtin:subhanAllah": { removed: true, at: 3 } },
  };

  it("replaces the data with a snapshot, drops rounds in progress, and keeps this device's settings", () => {
    const old = zikir().createItem(itemInput());
    taps({ kind: "item", id: old }, 1);
    zikir().setSettings({ view: "dial", sound: false });
    zikir().restore(snapshot);
    expect(zikir().items.map((entry) => entry.id)).toEqual(["kept"]);
    expect(zikir().counts).toEqual(snapshot.counts);
    expect(zikir().history).toEqual(snapshot.history);
    expect(isBuiltInRemoved(zikir(), "builtin:subhanAllah")).toBe(true);
    expect(zikir().runs).toEqual({});
    expect(zikir().settings).toMatchObject({ view: "dial", sound: false });
  });

  it("keeps counting with the restored data, on top of what another device counted", () => {
    zikir().restore(snapshot);
    zikir().tap({ kind: "item", id: "kept" }, DAY);
    expect(itemDayTotal(zikir().counts, "2026-10-01", "kept")).toBe(7);
    expect(itemDayTotal(zikir().counts, TODAY, "kept")).toBe(1);
  });
});
