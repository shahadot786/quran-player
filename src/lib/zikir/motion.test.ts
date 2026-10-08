import { describe, expect, it } from "vitest";
import { smoothDamp, type Spring } from "./motion";

function settle(from: number, to: number, smoothTime: number, seconds: number, dt = 1 / 60): Spring {
  let spring: Spring = { value: from, velocity: 0 };
  for (let t = 0; t < seconds; t += dt) spring = smoothDamp(spring, to, smoothTime, dt);
  return spring;
}

describe("smoothDamp", () => {
  it("settles on the target", () => {
    const end = settle(0, 10, 0.2, 2);
    expect(end.value).toBeCloseTo(10, 3);
    expect(Math.abs(end.velocity)).toBeLessThan(0.01);
  });

  it("never overshoots a target it is approaching", () => {
    let spring: Spring = { value: 0, velocity: 0 };
    for (let i = 0; i < 300; i += 1) {
      spring = smoothDamp(spring, 5, 0.15, 1 / 60);
      expect(spring.value).toBeLessThanOrEqual(5.0001);
    }
  });

  it("moves toward a target below as well as above", () => {
    const end = settle(10, -4, 0.2, 2);
    expect(end.value).toBeCloseTo(-4, 3);
  });

  it("reaches the same place whatever the frame rate", () => {
    const slow = settle(0, 1, 0.2, 1, 1 / 30);
    const fast = settle(0, 1, 0.2, 1, 1 / 120);
    expect(slow.value).toBeCloseTo(fast.value, 1);
  });

  it("stays put when it is already there", () => {
    expect(smoothDamp({ value: 3, velocity: 0 }, 3, 0.2, 1 / 60)).toEqual({ value: 3, velocity: 0 });
  });

  it("does not blow up on an odd frame time", () => {
    expect(smoothDamp({ value: 0, velocity: 0 }, 1, 0.2, 0)).toEqual({ value: 0, velocity: 0 });
    const long = smoothDamp({ value: 0, velocity: 0 }, 1, 0.2, 5);
    expect(long.value).toBeGreaterThan(0.9);
    expect(long.value).toBeLessThanOrEqual(1);
  });
});
