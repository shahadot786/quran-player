import { describe, expect, it } from "vitest";
import type { SourceMoshaf, SourceReciter } from "../types";
import { mergeReciters, nameKey, sameReciter, variantKey } from "./merge";

const ALL = Array.from({ length: 114 }, (_, i) => i + 1);

function moshaf(id: number, name = "Hafs A'n Assem, Murattal", overrides: Partial<SourceMoshaf> = {}): SourceMoshaf {
  return { id, name, server: `https://s.example/${id}/`, padded: true, downloadable: true, surahs: ALL, ...overrides };
}

function reciter(id: number, name: string, moshafs: SourceMoshaf[]): SourceReciter {
  return { id, name, moshafs };
}

describe("nameKey and sameReciter", () => {
  it.each([
    ["Mishary Alafasi", "Mishari Rashid al-`Afasy"],
    ["Mishary Alafasi", "Mishary Rashid Alafasy"],
    ["Abdulbasit Abdulsamad", "AbdulBaset AbdulSamad"],
    ["Abdulbasit Abdulsamad", "Abdul Basit Abdus-Samad (Mujawwad)"],
    ["Saud Al-Shuraim", "Sa'ud ash-Shuraym"],
    ["Shaik Abu Bakr Al Shatri", "Abu Bakr al-Shatri"],
    ["Hani Arrifai", "Hani ar-Rifai"],
    ["Mahmoud Khalil Al-Hussary", "Mahmoud Khalil Al-Husary"],
  ])("matches %s with %s", (a, b) => {
    expect(sameReciter(a, b)).toBe(true);
  });

  it.each([
    ["Abdullah Al-Khalaf", "Abdullah al-Khulaifi"],
    ["Ahmad Talib bin Humaid", "Ahmed al-Hammad"],
    ["Hani Arrifai", "Mahmood Al rifai"],
  ])("keeps %s and %s apart", (a, b) => {
    expect(sameReciter(a, b)).toBe(false);
  });

  it("ignores diacritics and parentheses in the key", () => {
    expect(nameKey("Mishāry Alafasy (Murattal)")).toBe(nameKey("Mishary Alafasy"));
  });
});

describe("variantKey", () => {
  it("separates riwayat and styles", () => {
    expect(variantKey("Rewayat Hafs A'n Assem - Murattal")).toBe("hafs:murattal");
    expect(variantKey("Murattal")).toBe("hafs:murattal");
    expect(variantKey("Almusshaf Al Mojawwad")).toBe("hafs:mujawwad");
    expect(variantKey("Mujawwad")).toBe("hafs:mujawwad");
    expect(variantKey("Almusshaf Al Mo'lim")).toBe("hafs:muallim");
    expect(variantKey("Muallim")).toBe("hafs:muallim");
    expect(variantKey("Warsh A'n Nafi', Murattal")).toBe("warsh:murattal");
    expect(variantKey("Qaloon")).toBe("qalun:murattal");
  });
});

describe("mergeReciters", () => {
  it("drops incomplete recitations and reciters left without any", () => {
    const merged = mergeReciters([
      [
        reciter(1, "Mishary Alafasi", [moshaf(11, "Kisai partial", { surahs: [1, 2, 3] }), moshaf(12)]),
        reciter(2, "Partial Only", [moshaf(21, "Hafs", { surahs: ALL.slice(0, 113) })]),
      ],
    ]);
    expect(merged).toEqual([
      { id: 1, name: "Mishary Alafasi", moshafs: [{ id: 12, name: "Hafs A'n Assem, Murattal", server: "https://s.example/12/", padded: true, downloadable: true }] },
    ]);
  });

  it("adds a later source's recitation only when its style is missing, keeping the first name and id", () => {
    const merged = mergeReciters([
      [reciter(51, "Abdulbasit Abdulsamad", [moshaf(1)])],
      [
        reciter(100002, "AbdulBaset AbdulSamad", [moshaf(100002, "Murattal")]),
        reciter(100001, "AbdulBaset AbdulSamad", [moshaf(100001, "Mujawwad")]),
      ],
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 51, name: "Abdulbasit Abdulsamad" });
    expect(merged[0]!.moshafs.map((m) => m.id)).toEqual([1, 100001]);
  });

  it("fills a reciter whose only complete recitation comes from a later source", () => {
    const merged = mergeReciters([
      [reciter(7, "Majed Al-Enezi", [moshaf(70, "Hafs", { surahs: ALL.slice(0, 113) })])],
      [reciter(200001, "Majed al-Enezi", [moshaf(200001, "Murattal", { downloadable: false, padded: false })])],
    ]);
    expect(merged).toEqual([
      { id: 200001, name: "Majed al-Enezi", moshafs: [expect.objectContaining({ id: 200001, downloadable: false })] },
    ]);
  });

  it("keeps several complete recitations of the same style from one reciter", () => {
    const merged = mergeReciters([[reciter(1, "Reciter", [moshaf(1), moshaf(2)])]]);
    expect(merged[0]!.moshafs).toHaveLength(2);
  });

  it("does not merge two different primary reciters that share a key", () => {
    const merged = mergeReciters([[reciter(1, "Mohammed Ayyub", [moshaf(1)]), reciter(2, "Muhammad Ayyoub", [moshaf(2)])]]);
    expect(merged.map((r) => r.id).sort()).toEqual([1, 2]);
  });

  it("adds unmatched reciters from later sources and sorts by name", () => {
    const merged = mergeReciters([[reciter(1, "Zaid", [moshaf(1)])], [], [reciter(200005, "Adil al-Kalbani", [moshaf(200005, "Murattal")])]]);
    expect(merged.map((r) => r.name)).toEqual(["Adil al-Kalbani", "Zaid"]);
  });
});
