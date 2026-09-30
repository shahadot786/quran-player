import { describe, expect, it } from "vitest";
import { QURAN_COM_ID_OFFSET, toQuranComReciter } from "./quran-com";

const files = (base: string, padded: boolean, count = 114) =>
  Array.from({ length: count }, (_, i) => ({ chapter_id: i + 1, audio_url: `${base}${padded ? String(i + 1).padStart(3, "0") : i + 1}.mp3` }));

describe("toQuranComReciter", () => {
  it("detects unpadded file names", () => {
    const reciter = toQuranComReciter({ id: 7, reciter_name: "Mishari Rashid al-`Afasy", style: null }, files("https://q.example/afasy/", false));
    expect(reciter).toMatchObject({ id: QURAN_COM_ID_OFFSET + 7, name: "Mishari Rashid al-'Afasy" });
    expect(reciter!.moshafs[0]).toMatchObject({ name: "Murattal", server: "https://q.example/afasy/", padded: false, downloadable: true });
    expect(reciter!.moshafs[0]!.surahs).toHaveLength(114);
  });

  it("detects 3-digit padded file names", () => {
    const reciter = toQuranComReciter({ id: 10, reciter_name: "Sa`ud ash-Shuraym", style: "Murattal" }, files("https://q.example/shuraym/", true));
    expect(reciter!.moshafs[0]).toMatchObject({ padded: true, server: "https://q.example/shuraym/" });
    expect(reciter!.moshafs[0]!.surahs).toHaveLength(114);
  });

  it("dedupes chapters and drops files that don't follow the server pattern", () => {
    const list = [...files("https://q.example/a/", false, 3), { chapter_id: 2, audio_url: "https://q.example/a/2.mp3" }, { chapter_id: 4, audio_url: "https://other.example/4.mp3" }];
    expect(toQuranComReciter({ id: 1, reciter_name: "A", style: "Mujawwad" }, list)!.moshafs[0]!.surahs).toEqual([1, 2, 3]);
  });

  it("returns null without a first surah to derive the server from", () => {
    expect(toQuranComReciter({ id: 1, reciter_name: "A", style: null }, [{ chapter_id: 2, audio_url: "https://q.example/2.mp3" }])).toBeNull();
  });
});
