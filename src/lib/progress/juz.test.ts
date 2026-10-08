import { describe, expect, it } from "vitest";
import { SURAHS } from "../surahs";
import { AYAH_TOTAL, JUZS, getJuz, parasOfSurah } from "./juz";

describe("para data", () => {
  it("has 30 paras that together cover every ayah exactly once", () => {
    expect(JUZS).toHaveLength(30);
    expect(JUZS.map((j) => j.juz)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    const seen = new Set<string>();
    for (const { portions } of JUZS) {
      for (const { surah, from, to } of portions) {
        expect(from).toBeGreaterThanOrEqual(1);
        expect(to).toBeLessThanOrEqual(SURAHS[surah - 1]!.versesCount);
        for (let ayah = from; ayah <= to; ayah += 1) {
          expect(seen.has(`${surah}:${ayah}`)).toBe(false);
          seen.add(`${surah}:${ayah}`);
        }
      }
    }
    expect(seen.size).toBe(AYAH_TOTAL);
    expect(AYAH_TOTAL).toBe(6236);
  });

  it("matches well-known boundaries", () => {
    expect(getJuz(1)!.portions).toEqual([
      { surah: 1, from: 1, to: 7 },
      { surah: 2, from: 1, to: 141 },
    ]);
    expect(getJuz(2)!.portions).toEqual([{ surah: 2, from: 142, to: 252 }]);
    expect(getJuz(29)!.portions.map((p) => p.surah)).toEqual(Array.from({ length: 11 }, (_, i) => 67 + i));
    expect(getJuz(30)!.portions.map((p) => p.surah)).toEqual(Array.from({ length: 37 }, (_, i) => 78 + i));
    for (const juz of [29, 30]) {
      for (const p of getJuz(juz)!.portions) expect(p).toMatchObject({ from: 1, to: SURAHS[p.surah - 1]!.versesCount });
    }
  });

  it("finds the paras a surah belongs to", () => {
    expect(parasOfSurah(2)).toEqual([1, 2, 3]);
    expect(parasOfSurah(1)).toEqual([1]);
    expect(parasOfSurah(114)).toEqual([30]);
    expect(parasOfSurah(0)).toEqual([]);
  });

  it("returns undefined for a para that does not exist", () => {
    expect(getJuz(0)).toBeUndefined();
    expect(getJuz(31)).toBeUndefined();
  });
});
