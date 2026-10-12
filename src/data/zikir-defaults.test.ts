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

  it("shows every built-in item and group now that all of them are confirmed", () => {
    expect(BUILT_IN_ITEMS.every((item) => item.reviewed)).toBe(true);
    expect(BUILT_IN_GROUPS.every((group) => group.reviewed)).toBe(true);
    expect(visibleBuiltInGroups().map((group) => group.key)).toEqual(["afterSalah", "istighfarSalawat", "morningAdhkar", "eveningAdhkar"]);
    expect(visibleBuiltInItems()).toHaveLength(BUILT_IN_ITEMS.length);
  });

  it("builds the morning and evening groups from Hisnul Muslim in the book's order", () => {
    const keys = (id: string) => getBuiltInGroup(id)!.steps.map((step) => getBuiltInItem(step.itemId)!.key);
    const morning = keys("builtin:morningAdhkar");
    const evening = keys("builtin:eveningAdhkar");
    expect(morning.slice(0, 5)).toEqual(["hisn75a", "ayatAlKursi", "ikhlas", "falaq", "nas"]);
    expect(evening.slice(0, 5)).toEqual(morning.slice(0, 5));
    expect(morning.at(-1)).toBe("hisn98");
    expect(evening.at(-1)).toBe("hisn98");
  });

  it("keeps morning-only and evening-only wording out of the other group", () => {
    const keys = (id: string) => getBuiltInGroup(id)!.steps.map((step) => getBuiltInItem(step.itemId)!.key);
    const morning = keys("builtin:morningAdhkar");
    const evening = keys("builtin:eveningAdhkar");
    expect(morning.filter((key) => /e$/.test(key) && key.startsWith("hisn"))).toEqual([]);
    for (const key of ["hisn77e", "hisn78e", "hisn80e", "hisn81e", "hisn89e", "hisn90e", "audhuKalimat"]) {
      expect(morning, key).not.toContain(key);
      expect(evening, key).toContain(key);
    }
    for (const key of ["hisn77", "hisn78", "hisn80", "hisn81", "hisn89", "hisn90", "hisn94", "hisn95"]) {
      expect(evening, key).not.toContain(key);
      expect(morning, key).toContain(key);
    }
  });

  it("keeps the counts the book gives", () => {
    const target = (key: string) => getBuiltInItem(`builtin:${key}`)!.target;
    expect(target("hisn80")).toBe(4);
    expect(target("hisn82")).toBe(3);
    expect(target("hisn83")).toBe(7);
    expect(target("hisn86")).toBe(3);
    expect(target("hisn87")).toBe(3);
    expect(target("hisn94")).toBe(3);
    expect(target("hisn96")).toBe(100);
    expect(target("hisn98")).toBe(10);
  });

  it("has transliteration in both languages for every Hisnul Muslim item", () => {
    for (const messages of [en, bn]) {
      for (const item of BUILT_IN_ITEMS.filter((entry) => entry.collection === "hisn" && entry.key.startsWith("hisn"))) {
        const text = (messages.zikir.items as Record<string, Record<string, string>>)[item.key];
        expect(text?.transliteration?.trim(), item.key).toBeTruthy();
      }
    }
  });

  it("writes the Bengali in Bengali script, without Latin letters", () => {
    for (const item of BUILT_IN_ITEMS.filter((entry) => entry.key.startsWith("hisn"))) {
      const text = (bn.zikir.items as Record<string, Record<string, string>>)[item.key]!;
      for (const field of ["name", "transliteration", "meaning"]) expect(text[field], `${item.key}.${field}`).not.toMatch(/[A-Za-z]/);
    }
  });

  // The Quranic items use the Uthmani spelling as published, which keeps a tatweel inside some words, so only the copied Hisnul Muslim text is held to this.
  it("carries no stray tatweel, invisible marks or doubled diacritics in the Hisnul Muslim Arabic", () => {
    for (const item of BUILT_IN_ITEMS.filter((entry) => entry.key.startsWith("hisn"))) {
      expect(item.arabic, item.id).not.toMatch(/[\u0640\u200f\u200e]/);
      expect(item.arabic, item.id).not.toMatch(/([\u064b-\u0652])\1/);
      expect(item.arabic, item.id).not.toMatch(/\s[\u064b-\u0652]/);
    }
  });
});
