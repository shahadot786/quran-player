import { createStore, get as idbGet, set as idbSet, type UseStore } from "idb-keyval";
import { SURAHS } from "./surahs";

export type Ayah = {
  numberInSurah: number;
  arabic: string;
  bengali: string;
};

export type SurahText = {
  surahId: number;
  name: string;
  arabicName: string;
  versesCount: number;
  bismillahPre: boolean;
  ayahs: Ayah[];
};

type AlQuranEditionAyah = {
  numberInSurah: number;
  text: string;
};

type AlQuranSurahResponse = {
  code: number;
  status: string;
  data: [
    {
      number: number;
      name: string;
      ayahs: AlQuranEditionAyah[];
    },
    {
      number: number;
      ayahs: AlQuranEditionAyah[];
    },
  ];
};

type QuranComVerse = {
  verse_number: number;
  text_uthmani: string;
  translations?: Array<{ text: string }>;
};

type QuranComResponse = {
  verses: QuranComVerse[];
};

const BISMILLAH_ARABIC = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_CLEAN_REGEX = /^بِسْمِ\s*ٱللَّهِ\s*ٱلرَّحْمَٰنِ\s*ٱلرَّحِيمِ\s*/;

const memoryCache = new Map<number, SurahText>();

let textStore: UseStore | null = null;
function getTextStore() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return null;
  textStore ??= createStore("qp-quran-texts", "surahs");
  return textStore;
}

export function cleanAyahText(surahId: number, ayahNumber: number, arabicText: string): string {
  if (surahId > 1 && surahId !== 9 && ayahNumber === 1) {
    return arabicText.replace(BISMILLAH_CLEAN_REGEX, "").trim();
  }
  return arabicText.trim();
}

export function cleanBengaliText(text: string): string {
  return text.replace(/<sup[^>]*>.*?<\/sup>/gi, "").replace(/<[^>]+>/g, "").trim();
}

async function fetchFromAlQuranCloud(surahId: number): Promise<SurahText | null> {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,bn.bengali`);
  if (!res.ok) return null;
  const json = (await res.json()) as AlQuranSurahResponse;
  if (!json.data || json.data.length < 2) return null;

  const [arabicData, bengaliData] = json.data;
  const meta = SURAHS.find((s) => s.id === surahId);
  const ayahs: Ayah[] = [];

  const count = Math.min(arabicData.ayahs.length, bengaliData.ayahs.length);
  for (let i = 0; i < count; i++) {
    const ar = arabicData.ayahs[i];
    const bn = bengaliData.ayahs[i];
    ayahs.push({
      numberInSurah: ar.numberInSurah,
      arabic: cleanAyahText(surahId, ar.numberInSurah, ar.text),
      bengali: cleanBengaliText(bn.text),
    });
  }

  return {
    surahId,
    name: meta?.name ?? `Surah ${surahId}`,
    arabicName: meta?.arabicName ?? arabicData.name,
    versesCount: ayahs.length,
    bismillahPre: surahId !== 1 && surahId !== 9,
    ayahs,
  };
}

async function fetchFromQuranCom(surahId: number): Promise<SurahText | null> {
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=bn&words=false&translations=161&fields=text_uthmani&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as QuranComResponse;
  if (!json.verses || json.verses.length === 0) return null;

  const meta = SURAHS.find((s) => s.id === surahId);
  const ayahs: Ayah[] = json.verses.map((v) => ({
    numberInSurah: v.verse_number,
    arabic: cleanAyahText(surahId, v.verse_number, v.text_uthmani),
    bengali: cleanBengaliText(v.translations?.[0]?.text ?? ""),
  }));

  return {
    surahId,
    name: meta?.name ?? `Surah ${surahId}`,
    arabicName: meta?.arabicName ?? "",
    versesCount: ayahs.length,
    bismillahPre: surahId !== 1 && surahId !== 9,
    ayahs,
  };
}

export async function getSurahText(surahId: number): Promise<SurahText> {
  if (surahId < 1 || surahId > 114) {
    throw new Error(`Invalid surah id: ${surahId}`);
  }

  const cached = memoryCache.get(surahId);
  if (cached) return cached;

  const store = getTextStore();
  if (store) {
    try {
      const persisted = await idbGet<SurahText>(String(surahId), store);
      if (persisted && persisted.ayahs && persisted.ayahs.length > 0) {
        memoryCache.set(surahId, persisted);
        return persisted;
      }
    } catch {
      // Continue to network fetch
    }
  }

  let result: SurahText | null = null;
  try {
    result = await fetchFromAlQuranCloud(surahId);
  } catch {
    result = null;
  }

  if (!result) {
    try {
      result = await fetchFromQuranCom(surahId);
    } catch {
      result = null;
    }
  }

  if (!result || result.ayahs.length === 0) {
    throw new Error(`Failed to load verses for surah ${surahId}`);
  }

  memoryCache.set(surahId, result);

  if (store) {
    idbSet(String(surahId), result, store).catch(() => {});
  }

  return result;
}

export { BISMILLAH_ARABIC };
