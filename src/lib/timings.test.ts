import { describe, expect, it } from "vitest";
import { activeAyahAt, fitsDuration, parseMp3QuranTimings, parseQuranComTimings, timingsUrl, type SurahTimings } from "./timings";

const row = (ayah: number, start_time: number, end_time: number) => ({ ayah, start_time, end_time, polygon: "0,0", page: "x.svg" });

describe("parseMp3QuranTimings", () => {
  it("converts milliseconds to seconds", () => {
    expect(parseMp3QuranTimings([row(1, 0, 13189), row(2, 13189, 19867)], 2)).toEqual({
      preamble: null,
      ayahs: [
        { ayah: 1, start: 0, end: 13.189 },
        { ayah: 2, start: 13.189, end: 19.867 },
      ],
    });
  });

  it("keeps the ayah 0 row as the preamble instead of counting it as a verse", () => {
    const parsed = parseMp3QuranTimings([row(0, 0, 4000), row(1, 4000, 9000), row(2, 9000, 15000)], 2);
    expect(parsed?.preamble).toEqual({ start: 0, end: 4 });
    expect(parsed?.ayahs.map((a) => a.ayah)).toEqual([1, 2]);
  });

  it.each([
    ["a missing ayah", [row(1, 0, 5), row(2, 5, 9)], 3],
    ["an extra ayah", [row(1, 0, 5), row(2, 5, 9), row(3, 9, 12)], 2],
    ["out-of-order ayahs", [row(2, 0, 5), row(1, 5, 9)], 2],
    ["a start that goes backwards", [row(1, 5000, 9000), row(2, 4000, 8000)], 2],
    ["an empty ayah", [row(1, 0, 0), row(2, 0, 5)], 2],
    ["a preamble with no length", [row(0, 3000, 3000), row(1, 3000, 9000)], 1],
  ])("rejects %s", (_name, rows, count) => {
    expect(parseMp3QuranTimings(rows, count)).toBeNull();
  });

  it("rejects payloads that aren't rows", () => {
    expect(parseMp3QuranTimings(null, 1)).toBeNull();
    expect(parseMp3QuranTimings({ error: "nope" }, 1)).toBeNull();
    expect(parseMp3QuranTimings(["x"], 1)).toBeNull();
    expect(parseMp3QuranTimings([{ ayah: "one", start_time: "a", end_time: "b" }], 1)).toBeNull();
  });
});

describe("parseQuranComTimings", () => {
  const verse = (key: string, from: number, to: number) => ({ verse_key: key, timestamp_from: from, timestamp_to: to, segments: [] });

  it("reads verse keys and timestamps", () => {
    expect(parseQuranComTimings([verse("1:1", 0, 6090), verse("1:2", 6090, 11680)], 1, 2)).toEqual({
      preamble: null,
      ayahs: [
        { ayah: 1, start: 0, end: 6.09 },
        { ayah: 2, start: 6.09, end: 11.68 },
      ],
    });
  });

  it("rejects verses from another surah or an incomplete list", () => {
    expect(parseQuranComTimings([verse("2:1", 0, 5), verse("2:2", 5, 9)], 1, 2)).toBeNull();
    expect(parseQuranComTimings([verse("1:1", 0, 5)], 1, 2)).toBeNull();
    expect(parseQuranComTimings("nope", 1, 2)).toBeNull();
  });
});

describe("activeAyahAt", () => {
  const timings: SurahTimings = {
    preamble: { start: 0, end: 4 },
    ayahs: [
      { ayah: 1, start: 4, end: 10 },
      { ayah: 2, start: 10, end: 16 },
      { ayah: 3, start: 18, end: 25 },
    ],
  };

  it("returns the preamble before the first ayah", () => {
    expect(activeAyahAt(timings, 0)).toBe(0);
    expect(activeAyahAt(timings, 3.99)).toBe(0);
  });

  it("switches exactly on the boundary", () => {
    expect(activeAyahAt(timings, 4)).toBe(1);
    expect(activeAyahAt(timings, 9.999)).toBe(1);
    expect(activeAyahAt(timings, 10)).toBe(2);
  });

  it("keeps the previous ayah through a pause and after the end", () => {
    expect(activeAyahAt(timings, 17)).toBe(2);
    expect(activeAyahAt(timings, 25)).toBe(3);
    expect(activeAyahAt(timings, 9999)).toBe(3);
  });

  it("starts on the first ayah when there is no preamble", () => {
    expect(activeAyahAt({ preamble: null, ayahs: timings.ayahs }, 0)).toBe(1);
  });

  it("finds the right ayah in a long surah", () => {
    const ayahs = Array.from({ length: 286 }, (_, i) => ({ ayah: i + 1, start: i * 30, end: i * 30 + 30 }));
    expect(activeAyahAt({ preamble: null, ayahs }, 143 * 30 + 12)).toBe(144);
    expect(activeAyahAt({ preamble: null, ayahs }, 285 * 30)).toBe(286);
  });
});

describe("fitsDuration", () => {
  const timings: SurahTimings = { preamble: null, ayahs: [{ ayah: 1, start: 0, end: 600 }] };

  it("accepts audio that ends a little after the last ayah, as real files do", () => {
    expect(fitsDuration(timings, 600)).toBe(true);
    expect(fitsDuration(timings, 601.6)).toBe(true);
    expect(fitsDuration(timings, 608.9)).toBe(true);
    expect(fitsDuration(timings, 598.5)).toBe(true);
  });

  it("rejects timings made for a different recording", () => {
    expect(fitsDuration(timings, 610)).toBe(false);
    expect(fitsDuration(timings, 597)).toBe(false);
    expect(fitsDuration(timings, 540)).toBe(false);
    expect(fitsDuration(timings, 720)).toBe(false);
  });

  it("allows proportionally more trailing audio on long surahs", () => {
    const long: SurahTimings = { preamble: null, ayahs: [{ ayah: 1, start: 0, end: 6000 }] };
    expect(fitsDuration(long, 6035)).toBe(true);
    expect(fitsDuration(long, 6037)).toBe(false);
  });

  it("allows an unknown duration while metadata loads", () => {
    expect(fitsDuration(timings, 0)).toBe(true);
    expect(fitsDuration(timings, Number.NaN)).toBe(true);
  });
});

describe("timingsUrl", () => {
  it("encodes the server", () => {
    expect(timingsUrl({ moshafId: 123, server: "https://server8.mp3quran.net/afs/", surah: 18 })).toBe(
      "/api/timings?moshaf=123&server=https%3A%2F%2Fserver8.mp3quran.net%2Fafs%2F&surah=18",
    );
  });
});
