import { describe, expect, it } from "vitest";
import bn from "../../messages/bn.json";
import en from "../../messages/en.json";
import { BUILT_IN_GROUPS, BUILT_IN_ITEMS, getBuiltInGroup, getBuiltInItem, isBuiltIn, visibleBuiltInGroups, visibleBuiltInItems } from "./zikir-defaults";

const ARABIC_LETTER = /[؀-ۿ]/;

describe("built-in zikir", () => {
  it("has unique ids and message keys", () => {
    const ids = [...BUILT_IN_ITEMS, ...BUILT_IN_GROUPS].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(BUILT_IN_ITEMS.map((item) => item.key)).size).toBe(BUILT_IN_ITEMS.length);
    expect(ids.every(isBuiltIn)).toBe(true);
  });

  it("gives every item Arabic text, a positive target and a source", () => {
    for (const item of BUILT_IN_ITEMS) {
      expect(item.arabic, item.id).toMatch(ARABIC_LETTER);
      expect(Number.isInteger(item.target) && item.target >= 1, item.id).toBe(true);
      expect(item.source.trim(), item.id).not.toBe("");
    }
  });

  it("has names and meanings in both languages for every item, and names and descriptions for every group", () => {
    for (const messages of [en, bn]) {
      for (const item of BUILT_IN_ITEMS) {
        const text = (messages.zikir.items as Record<string, Record<string, string>>)[item.key];
        expect(text?.name?.trim(), item.key).toBeTruthy();
        expect(text?.meaning?.trim(), item.key).toBeTruthy();
      }
      for (const group of BUILT_IN_GROUPS) {
        const text = (messages.zikir.groups as Record<string, Record<string, string>>)[group.key];
        expect(text?.name?.trim(), group.key).toBeTruthy();
        expect(text?.description?.trim(), group.key).toBeTruthy();
      }
    }
  });

  it("only lists steps that exist, with positive targets", () => {
    for (const group of BUILT_IN_GROUPS) {
      expect(group.steps.length, group.id).toBeGreaterThan(0);
      for (const step of group.steps) {
        expect(getBuiltInItem(step.itemId), `${group.id} -> ${step.itemId}`).toBeDefined();
        expect(step.target, group.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("keeps anything unconfirmed out of view, and never shows a group that depends on it", () => {
    const visibleItems = new Set(visibleBuiltInItems().map((item) => item.id));
    for (const group of visibleBuiltInGroups()) {
      for (const step of group.steps) expect(visibleItems.has(step.itemId), `${group.id} shows ${step.itemId}`).toBe(true);
    }
    expect(visibleBuiltInGroups().every((group) => group.reviewed)).toBe(true);
  });

  it("holds the after-salah group to 33, 33 and 34", () => {
    expect(getBuiltInGroup("builtin:afterSalah")!.steps.map((step) => [getBuiltInItem(step.itemId)!.key, step.target])).toEqual([
      ["subhanAllah", 33],
      ["alhamdulillah", 33],
      ["allahuAkbar", 34],
    ]);
  });

  it("keeps the morning and evening adhkar hidden until they are confirmed", () => {
    expect(getBuiltInGroup("builtin:morningAdhkar")!.reviewed).toBe(false);
    expect(getBuiltInGroup("builtin:eveningAdhkar")!.reviewed).toBe(false);
    expect(visibleBuiltInGroups().map((group) => group.key)).toEqual(["afterSalah", "istighfarSalawat"]);
  });
});
