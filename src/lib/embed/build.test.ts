import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, embedEntries, embedUrl, hostFor, hostFromName, placeholderHost, settingsFromParams, settingsQuery, type Settings } from "./build";

const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

describe("hostFromName", () => {
  it.each([
    ["example.com", "example.com"],
    ["https://www.Example.com/some/page?x=1", "example.com"],
    ["http://localhost:3000", "localhost"],
    ["www.metrokoi.com", "metrokoi.com"],
    ["My Great App", "my-great-app"],
    ["  Metro Koi!! ", "metro-koi"],
    ["app_name_2", "app-name-2"],
    ["a".repeat(80), "a".repeat(64)],
  ])("turns %j into %j", (input, expected) => expect(hostFromName(input)).toBe(expected));

  it.each(["", "   ", "আমার অ্যাপ", "!!!", "http://", "https://exa mple.com"])("gives nothing for %j", (input) => expect(hostFromName(input)).toBeNull());
});

describe("hostFor", () => {
  it("uses the name when there is one and a placeholder otherwise", () => {
    expect(hostFor(settings({ name: "Metro Koi" }), "app")).toBe("metro-koi");
    expect(hostFor(settings(), "web")).toBe(placeholderHost("web"));
    expect(hostFor(settings({ name: "???" }), "app")).toBe("my-app");
  });
});

describe("embedEntries", () => {
  it("is empty for the defaults", () => expect(embedEntries(DEFAULT_SETTINGS)).toEqual([]));

  it("lists only what differs, in a fixed order, with colours cleaned up", () => {
    const entries = embedEntries(settings({ theme: "dark", lang: "bn", size: "compact", style: "tilawah", reciter: 30, accent: "C2410C", bg: "#fff", radius: "lg" }));
    expect(entries).toEqual([["theme", "dark"], ["lang", "bn"], ["size", "compact"], ["style", "tilawah"], ["reciter", "30"], ["accent", "#c2410c"], ["bg", "#ffffff"], ["radius", "lg"]]);
  });

  it("leaves out colours that are not colours", () => {
    expect(embedEntries(settings({ accent: "red", card: "#12", text: "url(x)" }))).toEqual([]);
  });
});

describe("embedUrl", () => {
  it("has no query for the defaults and encodes the # of a colour", () => {
    expect(embedUrl("https://x.test", DEFAULT_SETTINGS)).toBe("https://x.test/embed");
    expect(embedUrl("https://x.test", settings({ accent: "#c2410c" }), [["preview", "1"]])).toBe("https://x.test/embed?accent=%23c2410c&preview=1");
  });
});

describe("settingsQuery and settingsFromParams", () => {
  it("round-trip the settings through an address", () => {
    const original = settings({ kind: "app", name: "My App", theme: "dark", lang: "bn", size: "compact", style: "tilawah", reciter: 92, accent: "#c2410c", radius: "sm" });
    const params = Object.fromEntries(new URLSearchParams(settingsQuery(original)));
    expect(settingsFromParams(params)).toEqual(original);
  });

  it("falls back to the defaults for missing or bad parameters", () => {
    expect(settingsFromParams({})).toEqual(DEFAULT_SETTINGS);
    expect(settingsFromParams({ kind: "robot", theme: "pink", reciter: "7", accent: "nope" })).toEqual(DEFAULT_SETTINGS);
  });

  it("limits the length of the name", () => {
    expect(settingsFromParams({ name: "n".repeat(500) }).name).toHaveLength(100);
  });
});
