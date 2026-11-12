import { describe, expect, it } from "vitest";
import { DEFAULT_WIDGET_RECITER, normalizeHex, normalizeHost, parseEmbedOptions, readableOn } from "./options";

describe("parseEmbedOptions", () => {
  it("uses the defaults when nothing is given", () => {
    expect(parseEmbedOptions({})).toEqual({
      theme: "auto",
      lang: "en",
      size: "full",
      style: "koi",
      radius: "md",
      reciter: DEFAULT_WIDGET_RECITER,
      colors: {},
      host: null,
      preview: false,
    });
  });

  it("reads valid values", () => {
    const options = parseEmbedOptions({ theme: "dark", lang: "bn", size: "compact", style: "tilawah", radius: "lg", reciter: "30", host: "MetroKoi-App" });
    expect(options).toMatchObject({ theme: "dark", lang: "bn", size: "compact", style: "tilawah", radius: "lg", reciter: 30, host: "metrokoi-app" });
  });

  it("marks a preview only for preview=1", () => {
    expect(parseEmbedOptions({ preview: "1" }).preview).toBe(true);
    for (const value of ["0", "true", "", undefined]) expect(parseEmbedOptions({ preview: value }).preview).toBe(false);
  });

  it("falls back on bad values", () => {
    const options = parseEmbedOptions({ theme: "pink", lang: "fr", size: "huge", style: "x", radius: "9", reciter: "999", host: "bad host!" });
    expect(options).toMatchObject({ theme: "auto", lang: "en", size: "full", style: "koi", radius: "md", reciter: DEFAULT_WIDGET_RECITER, host: null });
  });

  it("uses the first value of a repeated parameter", () => {
    expect(parseEmbedOptions({ theme: ["dark", "light"] }).theme).toBe("dark");
  });

  it("keeps only valid colours", () => {
    const { colors } = parseEmbedOptions({ accent: "#0A7", bg: "eef6f3", card: "red", text: "url(x)" });
    expect(colors).toEqual({ accent: "#00aa77", bg: "#eef6f3" });
  });
});

describe("normalizeHex", () => {
  it.each([
    ["#fff", "#ffffff"],
    ["13756A", "#13756a"],
    ["#13756a80", "#13756a80"],
  ])("accepts %s", (input, expected) => expect(normalizeHex(input)).toBe(expected));

  it.each(["", "#12", "#12345", "#ggg", "red;}", undefined])("rejects %s", (input) => expect(normalizeHex(input)).toBeNull());
});

describe("readableOn", () => {
  it("picks white on dark and black on light colours", () => {
    expect(readableOn("#13756a")).toBe("#ffffff");
    expect(readableOn("#ffe08a")).toBe("#000000");
  });
});

describe("normalizeHost", () => {
  it("lower-cases, drops www and rejects odd text", () => {
    expect(normalizeHost("WWW.Metrokoi.com")).toBe("metrokoi.com");
    expect(normalizeHost("a b")).toBeNull();
    expect(normalizeHost("x".repeat(65))).toBeNull();
    expect(normalizeHost(undefined)).toBeNull();
  });
});
