import { describe, expect, it } from "vitest";
import { BEAD_COUNT, activeBead, beadStep, litTicks, ringOffset, shouldSnap } from "./beads";

describe("bead loop", () => {
  it("spaces beads evenly around the loop", () => {
    expect(beadStep(33) * 33).toBeCloseTo(Math.PI * 2, 9);
    expect(BEAD_COUNT).toBe(33);
  });

  it("brings the marker bead to the thumb at the start, and again after a full loop", () => {
    expect(ringOffset(0)).toBeCloseTo(-Math.PI / 2, 9);
    expect(ringOffset(BEAD_COUNT) - ringOffset(0)).toBeCloseTo(Math.PI * 2, 9);
    expect(activeBead(0)).toBe(0);
    expect(activeBead(BEAD_COUNT)).toBe(0);
  });

  it("moves exactly one bead per count", () => {
    expect(ringOffset(1) - ringOffset(0)).toBeCloseTo(beadStep(BEAD_COUNT), 9);
    expect(ringOffset(40) - ringOffset(39)).toBeCloseTo(beadStep(BEAD_COUNT), 9);
  });

  it("names the bead at the thumb, counting back from the marker", () => {
    expect(activeBead(1)).toBe(BEAD_COUNT - 1);
    expect(activeBead(2)).toBe(BEAD_COUNT - 2);
    expect(activeBead(BEAD_COUNT + 5)).toBe(BEAD_COUNT - 5);
    expect(activeBead(10)).toBeGreaterThanOrEqual(0);
  });

  it("jumps instead of spinning when the count resets by a lot", () => {
    const step = beadStep(BEAD_COUNT);
    expect(shouldSnap(ringOffset(5), ringOffset(6))).toBe(false);
    expect(shouldSnap(ringOffset(5), ringOffset(7))).toBe(false);
    expect(shouldSnap(ringOffset(20), ringOffset(0))).toBe(true);
    expect(shouldSnap(0, 3.5 * step)).toBe(true);
  });
});

describe("litTicks", () => {
  it("lights ticks in proportion to the count, never past the end", () => {
    expect(litTicks(0, 60)).toBe(0);
    expect(litTicks(0.5, 60)).toBe(30);
    expect(litTicks(1, 60)).toBe(60);
    expect(litTicks(2, 60)).toBe(60);
    expect(litTicks(-1, 60)).toBe(0);
  });

  it("lights nothing when there is no limit", () => {
    expect(litTicks(null, 60)).toBe(0);
  });
});
