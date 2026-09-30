import { describe, expect, it } from "vitest";
import { formatBytes, formatTime, initials, localDateKey } from "./format";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [65.9, "1:05"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3725, "1:02:05"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it("falls back to zero for invalid input", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
    expect(formatTime(-4)).toBe("0:00");
  });
});

describe("initials", () => {
  it("skips honorific particles and takes two letters", () => {
    expect(initials("Abdul Basit Abdul Samad")).toBe("AB");
    expect(initials("Mishary bin Rashid Alafasy")).toBe("MR");
    expect(initials("Al-Husary")).toBe("H");
  });

  it("falls back to the first character for non-latin names", () => {
    expect(initials("مشاري")).toBe("م");
  });
});

describe("localDateKey", () => {
  it("uses the local calendar date with zero padding", () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localDateKey(new Date(2026, 11, 31, 0, 1))).toBe("2026-12-31");
  });
});

describe("formatBytes", () => {
  it("scales between MB and GB", () => {
    expect(formatBytes(0)).toBe("0 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(48 * 1024 * 1024)).toBe("48 MB");
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1.5 GB");
  });
});
