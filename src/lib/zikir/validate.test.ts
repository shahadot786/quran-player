import { describe, expect, it } from "vitest";
import { MAX_COUNT, validateGroup, validateItem } from "./validate";

const item = (overrides = {}) => ({ name: "Morning", arabic: "", transliteration: "", meaning: "", limited: true, target: 33, hasGoal: false, dailyGoal: 0, ...overrides });
const group = (overrides = {}) => ({ name: "After salah", steps: [{ itemId: "a", target: 33 }], hasGoal: false, dailyGoal: 0, ...overrides });

describe("validateItem", () => {
  it("accepts a name with a target", () => {
    expect(validateItem(item())).toEqual({});
  });

  it("needs a name that is not just spaces", () => {
    expect(validateItem(item({ name: "   " }))).toEqual({ name: "required" });
  });

  it("needs a whole target of at least one when there is a limit", () => {
    expect(validateItem(item({ target: 0 }))).toEqual({ target: "invalid" });
    expect(validateItem(item({ target: 2.5 }))).toEqual({ target: "invalid" });
    expect(validateItem(item({ target: MAX_COUNT + 1 }))).toEqual({ target: "invalid" });
    expect(validateItem(item({ target: Number.NaN }))).toEqual({ target: "invalid" });
  });

  it("ignores the target when counting has no limit", () => {
    expect(validateItem(item({ limited: false, target: 0 }))).toEqual({});
  });

  it("checks the daily goal only when one is set", () => {
    expect(validateItem(item({ hasGoal: true, dailyGoal: 0 }))).toEqual({ dailyGoal: "invalid" });
    expect(validateItem(item({ hasGoal: true, dailyGoal: 100 }))).toEqual({});
    expect(validateItem(item({ hasGoal: false, dailyGoal: 0 }))).toEqual({});
  });

  it("reports every problem at once", () => {
    expect(validateItem(item({ name: "", target: 0, hasGoal: true, dailyGoal: -1 }))).toEqual({ name: "required", target: "invalid", dailyGoal: "invalid" });
  });
});

describe("validateGroup", () => {
  it("accepts a named group with steps", () => {
    expect(validateGroup(group())).toEqual({});
  });

  it("needs a name and at least one step", () => {
    expect(validateGroup(group({ name: "" }))).toEqual({ name: "required" });
    expect(validateGroup(group({ steps: [] }))).toEqual({ steps: "empty" });
  });

  it("needs every step to have a whole target of at least one", () => {
    expect(validateGroup(group({ steps: [{ itemId: "a", target: 3 }, { itemId: "b", target: 0 }] }))).toEqual({ steps: "invalid" });
  });

  it("checks the daily goal only when one is set", () => {
    expect(validateGroup(group({ hasGoal: true, dailyGoal: 0 }))).toEqual({ dailyGoal: "invalid" });
  });
});
