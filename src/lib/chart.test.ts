import { describe, expect, it } from "vitest";
import { axisTop } from "./chart";

const MINUTES = [5, 10, 15, 30, 60, 120, 240, 480];
const COUNTS = [10, 20, 50, 100, 200, 500, 1000];

describe("axisTop", () => {
  it("picks the smallest step that fits the biggest bar", () => {
    expect(axisTop(0, MINUTES, 60)).toBe(5);
    expect(axisTop(5, MINUTES, 60)).toBe(5);
    expect(axisTop(6, MINUTES, 60)).toBe(10);
    expect(axisTop(61, MINUTES, 60)).toBe(120);
    expect(axisTop(33, COUNTS, 1000)).toBe(50);
    expect(axisTop(100, COUNTS, 1000)).toBe(100);
  });

  it("goes up in whole fallback steps beyond the scale", () => {
    expect(axisTop(500, MINUTES, 60)).toBe(540);
    expect(axisTop(1001, COUNTS, 1000)).toBe(2000);
    expect(axisTop(4500, COUNTS, 1000)).toBe(5000);
  });
});
