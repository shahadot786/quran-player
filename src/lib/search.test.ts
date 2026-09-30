import { describe, expect, it } from "vitest";
import { matchesName, matchesSurah, normalize } from "./search";
import type { Surah } from "./types";

const surah: Surah = {
  id: 36,
  name: "Ya-Sin",
  arabicName: "يس",
  translation: "Ya Sin",
  versesCount: 83,
  revelation: "meccan",
  revelationOrder: 41,
};

describe("normalize", () => {
  it("lowercases and drops punctuation, spaces and diacritics", () => {
    expect(normalize("Ar-Raḥmān")).toBe("arrahman");
    expect(normalize("  Al Fatiha! ")).toBe("alfatiha");
  });
});

describe("matchesSurah", () => {
  it("matches everything for an empty query", () => {
    expect(matchesSurah(surah, "")).toBe(true);
    expect(matchesSurah(surah, "  ")).toBe(true);
  });

  it("matches a numeric query as a prefix of the surah number", () => {
    expect(matchesSurah(surah, "3")).toBe(true);
    expect(matchesSurah(surah, "36")).toBe(true);
    expect(matchesSurah(surah, "6")).toBe(false);
  });

  it("matches name, translation and arabic name regardless of punctuation", () => {
    expect(matchesSurah(surah, "yasin")).toBe(true);
    expect(matchesSurah(surah, "ya sin")).toBe(true);
    expect(matchesSurah(surah, "يس")).toBe(true);
    expect(matchesSurah(surah, "baqarah")).toBe(false);
  });
});

describe("matchesName", () => {
  it("matches partial names ignoring case and diacritics", () => {
    expect(matchesName("Mishary Alafasy", "ALAF")).toBe(true);
    expect(matchesName("Mishary Alafasy", "sudais")).toBe(false);
    expect(matchesName("Mishary Alafasy", "")).toBe(true);
    expect(matchesName("Mishary Alafasy", "মিশারি")).toBe(true);
    expect(matchesName("Abdulbasit Abdulsamad", "আব্দুল বাসিত")).toBe(true);
  });
});
