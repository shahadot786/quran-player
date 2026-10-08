import { describe, expect, it } from "vitest";
import {
  FINISHED_SLICES,
  SLICE_COUNT,
  countSlices,
  decodeSlices,
  emptySlices,
  encodeSlices,
  fullSlices,
  isFinished,
  markRange,
  markUpTo,
  rangeCoverage,
  unionSlices,
} from "./slices";

describe("markRange", () => {
  it("marks only the slices that playback entered", () => {
    expect(countSlices(markRange(emptySlices(), 0, 0.05))).toBe(10);
    expect(countSlices(markRange(emptySlices(), 0.5, 0.5))).toBe(1);
  });

  it("does not mark the next slice when playback stops exactly on a boundary", () => {
    const marked = markRange(emptySlices(), 0, 0.5);
    expect(countSlices(marked)).toBe(100);
    expect(rangeCoverage(marked, 100, 101)).toBe(0);
  });

  it("includes the last slice when playback reaches the end", () => {
    const marked = markRange(emptySlices(), 0.99, 1);
    expect(countSlices(marked)).toBe(2);
    expect(rangeCoverage(marked, 199, 200)).toBe(1);
  });

  it("never marks the same slice twice and does not change its input", () => {
    const first = markRange(emptySlices(), 0, 0.1);
    const second = markRange(first, 0.05, 0.15);
    expect(countSlices(first)).toBe(20);
    expect(countSlices(second)).toBe(30);
    expect(countSlices(emptySlices())).toBe(0);
  });

  it("ignores backwards, non-finite and out-of-range steps safely", () => {
    const base = markRange(emptySlices(), 0, 0.1);
    expect(markRange(base, 0.5, 0.4)).toBe(base);
    expect(markRange(base, Number.NaN, 0.4)).toBe(base);
    expect(countSlices(markRange(emptySlices(), -1, 2))).toBe(SLICE_COUNT);
  });
});

describe("finished", () => {
  it("needs 190 of 200 slices", () => {
    expect(isFinished(markUpTo(emptySlices(), 189 / 200))).toBe(false);
    expect(countSlices(markUpTo(emptySlices(), 190 / 200))).toBe(FINISHED_SLICES);
    expect(isFinished(markUpTo(emptySlices(), 190 / 200))).toBe(true);
    expect(isFinished(fullSlices())).toBe(true);
    expect(isFinished(emptySlices())).toBe(false);
  });

  it("markUpTo marks only slices fully passed", () => {
    expect(countSlices(markUpTo(emptySlices(), 0.2549))).toBe(50);
    expect(countSlices(markUpTo(emptySlices(), 0))).toBe(0);
    expect(countSlices(markUpTo(emptySlices(), 1))).toBe(SLICE_COUNT);
  });
});

describe("unionSlices", () => {
  it("combines what was heard on either side", () => {
    const a = markRange(emptySlices(), 0, 0.2);
    const b = markRange(emptySlices(), 0.1, 0.5);
    expect(countSlices(unionSlices(a, b))).toBe(100);
    expect(unionSlices(a, a)).toEqual(a);
  });
});

describe("encoding", () => {
  it("round-trips", () => {
    const slices = markRange(emptySlices(), 0.13, 0.77);
    expect(decodeSlices(encodeSlices(slices))).toEqual(slices);
    expect(encodeSlices(emptySlices())).toBe("A".repeat(34));
    expect(encodeSlices(fullSlices())).toMatch(/^[A-Za-z0-9_-]{34}$/);
  });

  it("rejects malformed input", () => {
    expect(decodeSlices("")).toBeNull();
    expect(decodeSlices("not base64!")).toBeNull();
    expect(decodeSlices(encodeSlices(emptySlices()).slice(4))).toBeNull();
    expect(decodeSlices(42 as unknown as string)).toBeNull();
  });
});

describe("rangeCoverage", () => {
  it("returns the covered share of a fractional range", () => {
    const slices = markRange(emptySlices(), 0, 0.5);
    expect(rangeCoverage(slices, 0, 100)).toBe(1);
    expect(rangeCoverage(slices, 50, 150)).toBeCloseTo(0.5);
    expect(rangeCoverage(slices, 100, 200)).toBe(0);
    expect(rangeCoverage(slices, 99.5, 100.5)).toBeCloseTo(0.5);
  });

  it("is zero for an empty range", () => {
    expect(rangeCoverage(fullSlices(), 10, 10)).toBe(0);
  });
});
