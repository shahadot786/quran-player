import { describe, expect, it } from "vitest";
import { cleanAyahText, cleanBengaliText } from "./quran-text";

describe("quran-text utilities", () => {
  it("cleans bismillah prefix from ayah 1 in surahs other than 1 and 9", () => {
    const raw = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ";
    const cleaned = cleanAyahText(112, 1, raw);
    expect(cleaned).toBe("قُلْ هُوَ ٱللَّهُ أَحَدٌ");
  });

  it("does not remove bismillah from surah 1 (Al-Fatihah)", () => {
    const raw = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const cleaned = cleanAyahText(1, 1, raw);
    expect(cleaned).toBe(raw);
  });

  it("does not remove bismillah from ayah 2+", () => {
    const raw = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const cleaned = cleanAyahText(112, 2, raw);
    expect(cleaned).toBe(raw);
  });

  it("cleans HTML footnote tags from Bengali text", () => {
    const raw = "বলুন, তিনি আল্লাহ, এক,<sup>১</sup>";
    expect(cleanBengaliText(raw)).toBe("বলুন, তিনি আল্লাহ, এক,");
  });

  it("fetches and parses surah text from API", async () => {
    const { getSurahText } = await import("./quran-text");
    const fakeResponse = {
      code: 200,
      status: "OK",
      data: [
        {
          number: 114,
          name: "سُورَةُ النَّاسِ",
          ayahs: [
            { numberInSurah: 1, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ" },
            { numberInSurah: 2, text: "مَلِكِ ٱلنَّاسِ" },
          ],
        },
        {
          number: 114,
          ayahs: [
            { numberInSurah: 1, text: "বলুন, আমি আশ্রয় গ্রহণ করিতেছি মানুষের পালনকর্তার," },
            { numberInSurah: 2, text: "মানুষের অধিপতির," },
          ],
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify(fakeResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    try {
      const res = await getSurahText(114);
      expect(res.surahId).toBe(114);
      expect(res.ayahs.length).toBe(2);
      expect(res.ayahs[0].arabic).toBe("قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ");
      expect(res.ayahs[0].bengali).toBe("বলুন, আমি আশ্রয় গ্রহণ করিতেছি মানুষের পালনকর্তার,");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects invalid surah id", async () => {
    const { getSurahText } = await import("./quran-text");
    await expect(getSurahText(0)).rejects.toThrow("Invalid surah id");
    await expect(getSurahText(115)).rejects.toThrow("Invalid surah id");
  });
});
