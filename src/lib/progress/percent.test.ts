import { describe, expect, it } from "vitest";
import { formatPercent } from "./percent";

describe("formatPercent", () => {
  it("shows whole numbers from 10% up, never rounding up to a finish", () => {
    expect(formatPercent(0.5)).toBe("50");
    expect(formatPercent(0.999)).toBe("99");
    expect(formatPercent(1)).toBe("100");
  });

  it("keeps one decimal below 10% and never shows a started surah as zero", () => {
    expect(formatPercent(0.034)).toBe("3.4");
    expect(formatPercent(0.0012)).toBe("0.1");
    expect(formatPercent(0.09)).toBe("9.0");
  });

  it("is 0 only when nothing was heard, and clamps odd input", () => {
    expect(formatPercent(0)).toBe("0");
    expect(formatPercent(-1)).toBe("0");
    expect(formatPercent(3)).toBe("100");
  });
});
