import { afterEach, describe, expect, it, vi } from "vitest";
import { Feedback, vibrate } from "./feedback";

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "vibrate");
});

describe("vibrate", () => {
  it("buzzes when the device can", () => {
    const spy = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: spy, configurable: true });
    vibrate("count");
    expect(spy).toHaveBeenCalledWith([12]);
    vibrate("round");
    expect(spy).toHaveBeenLastCalledWith([60, 50, 60, 50, 140]);
  });

  it("does nothing, quietly, on devices without vibration", () => {
    expect(() => vibrate("count")).not.toThrow();
  });
});

describe("Feedback", () => {
  it("respects the settings", () => {
    const spy = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: spy, configurable: true });
    new Feedback().play("count", { sound: true, haptics: false });
    expect(spy).not.toHaveBeenCalled();
    new Feedback().play("count", { sound: false, haptics: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("stays silent where the browser has no audio support", () => {
    expect(() => new Feedback().play("round", { sound: true, haptics: false })).not.toThrow();
  });
});
