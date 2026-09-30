import { describe, expect, it } from "vitest";
import { cleanMoshafName, normalizeMp3Quran } from "./mp3quran";

describe("cleanMoshafName", () => {
  it("strips the Rewayat prefix and de-duplicates segments", () => {
    expect(cleanMoshafName("Rewayat Hafs A'n Assem")).toBe("Hafs A'n Assem");
    expect(cleanMoshafName("Rewayat Hafs - Rewayat Hafs")).toBe("Hafs");
    expect(cleanMoshafName("Murattal - Rewayat Warsh")).toBe("Murattal, Warsh");
  });
});

describe("normalizeMp3Quran", () => {
  const raw = [
    {
      id: 2,
      name: " Zed ",
      moshaf: [{ id: 21, name: "Rewayat Hafs", server: "http://server.example/zed/", surah_list: "3,1,2,999,0" }],
    },
    {
      id: 1,
      name: "Abu",
      moshaf: [
        { id: 11, name: "Hafs", server: "https://server.example/abu/", surah_list: "114" },
        { id: 12, name: "Empty", server: "https://server.example/empty/", surah_list: "" },
      ],
    },
    { id: 3, name: "Nobody", moshaf: [{ id: 31, name: "Hafs", server: "https://server.example/n/", surah_list: "" }] },
  ];

  const result = normalizeMp3Quran(raw);

  it("sorts reciters by name and drops reciters without playable moshafs", () => {
    expect(result.map((r) => r.name)).toEqual(["Abu", "Zed"]);
  });

  it("drops moshafs with no surahs", () => {
    expect(result[0]!.moshafs.map((m) => m.id)).toEqual([11]);
  });

  it("upgrades servers to https, sorts surahs and discards out-of-range numbers", () => {
    expect(result[1]!.moshafs[0]).toEqual({
      id: 21,
      name: "Hafs",
      server: "https://server.example/zed/",
      padded: true,
      downloadable: true,
      surahs: [1, 2, 3],
    });
  });

  it("trims reciter names", () => {
    expect(result[1]!.name).toBe("Zed");
  });
});
