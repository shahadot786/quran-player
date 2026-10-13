import { describe, expect, it } from "vitest";
import { cleanDeviceName, DEVICE_NAME_LIMIT, describeDevice } from "./device-label";

const CASES: [string, string][] = [
  ["Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", "Chrome · Android"],
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "Safari · iPhone"],
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1", "Chrome · iPhone"],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", "Safari · macOS"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0", "Edge · Windows"],
  ["Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0", "Firefox · Linux"],
  ["Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36", "Samsung Internet · Android"],
  ["Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "Safari · iPad"],
];

describe("describeDevice", () => {
  it.each(CASES)("names %s", (agent, label) => {
    expect(describeDevice(agent)).toBe(label);
  });

  it("leaves out versions and phone models", () => {
    const label = describeDevice(CASES[0]![0]);
    expect(label).not.toMatch(/\d|Pixel|SM-/);
  });

  it("falls back to a plain word when nothing is recognised", () => {
    expect(describeDevice("")).toBe("Browser");
  });
});

describe("cleanDeviceName", () => {
  it("trims, collapses spaces and keeps the name short", () => {
    expect(cleanDeviceName("  My   phone \n")).toBe("My phone");
    expect(cleanDeviceName("x".repeat(100))).toHaveLength(DEVICE_NAME_LIMIT);
    expect(cleanDeviceName("   ")).toBe("");
  });
});
