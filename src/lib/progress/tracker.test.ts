import { describe, expect, it } from "vitest";
import { ContinuityTracker } from "./tracker";

const DURATION = 100;

function expectRange(range: { from: number; to: number } | null, from: number, to: number) {
  expect(range).not.toBeNull();
  expect(range!.from).toBeCloseTo(from, 6);
  expect(range!.to).toBeCloseTo(to, 6);
}

describe("ContinuityTracker", () => {
  it("returns nothing for the first sample, then the played range", () => {
    const tracker = new ContinuityTracker();
    expect(tracker.step(10, DURATION, 1)).toBeNull();
    expectRange(tracker.step(10.25, DURATION, 1), 0.1, 0.1025);
  });

  it("counts a normal run of timeupdate ticks as continuous", () => {
    const tracker = new ContinuityTracker();
    tracker.step(0, DURATION, 1);
    const ranges = [0.25, 0.5, 0.75, 1].map((t) => tracker.step(t, DURATION, 1));
    expect(ranges.every((r) => r !== null)).toBe(true);
    expectRange(ranges.at(-1)!, 0.0075, 0.01);
  });

  it("treats a jump forward as a seek, but continues counting afterwards", () => {
    const tracker = new ContinuityTracker();
    tracker.step(10, DURATION, 1);
    expect(tracker.step(40, DURATION, 1)).toBeNull();
    expectRange(tracker.step(40.25, DURATION, 1), 0.4, 0.4025);
  });

  it("treats going backwards (seek back or loop restart) as a jump", () => {
    const tracker = new ContinuityTracker();
    tracker.step(50, DURATION, 1);
    expect(tracker.step(20, DURATION, 1)).toBeNull();
    expect(tracker.step(20.25, DURATION, 1)).not.toBeNull();
  });

  it("ignores repeated samples at the same position", () => {
    const tracker = new ContinuityTracker();
    tracker.step(5, DURATION, 1);
    expect(tracker.step(5, DURATION, 1)).toBeNull();
  });

  it("allows bigger steps at higher playback speed and smaller ones at lower speed", () => {
    const fast = new ContinuityTracker();
    fast.step(0, DURATION, 2);
    expect(fast.step(3, DURATION, 2)).not.toBeNull();

    const slow = new ContinuityTracker();
    slow.step(0, DURATION, 0.5);
    expect(slow.step(1.5, DURATION, 0.5)).toBeNull();
    expect(slow.step(2.5, DURATION, 0.5)).not.toBeNull();
  });

  it("allows a small amount of slack at normal speed but not a skip", () => {
    const tracker = new ContinuityTracker();
    tracker.step(0, DURATION, 1);
    expect(tracker.step(1.7, DURATION, 1)).not.toBeNull();
    expect(tracker.step(3.6, DURATION, 1)).toBeNull();
  });

  it("starts over after reset, as when the track changes", () => {
    const tracker = new ContinuityTracker();
    tracker.step(50, DURATION, 1);
    tracker.reset();
    expect(tracker.step(51, DURATION, 1)).toBeNull();
    expect(tracker.step(51.25, DURATION, 1)).not.toBeNull();
  });

  it("ignores samples without a usable duration", () => {
    const tracker = new ContinuityTracker();
    expect(tracker.step(5, 0, 1)).toBeNull();
    expect(tracker.step(5.25, Number.NaN, 1)).toBeNull();
    expect(tracker.step(5.5, Number.POSITIVE_INFINITY, 1)).toBeNull();
    expect(tracker.step(Number.NaN, DURATION, 1)).toBeNull();
  });

  it("clamps the played range to the file", () => {
    const tracker = new ContinuityTracker();
    tracker.step(99.5, DURATION, 1);
    expectRange(tracker.step(100.4, DURATION, 1), 0.995, 1);
  });
});
