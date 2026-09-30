import synced from "@/data/synced-recitations.json";
import { getSurah } from "../surahs";
import { parseMp3QuranTimings, parseQuranComTimings, type SurahTimings } from "../timings";

const MP3QURAN = "https://www.mp3quran.net/api/v3/ayat_timing";
const QURAN_COM = "https://api.quran.com/api/v4/chapter_recitations";
export const QURAN_COM_MOSHAF_OFFSET = 100_000;
const QURAN_COM_MOSHAF_LIMIT = 200_000;
const REVALIDATE_SECONDS = 86400;

export const normalizeFolder = (url: string) => `${url.replace(/^http:/, "https:").replace(/\/+$/, "")}/`;

const readByFolder = new Map(synced.mp3quran.map((r) => [r.folder, r.read]));
const quranComIds = new Set(synced.quranCom);

export function isSynced(moshaf: { id: number; server: string }) {
  if (moshaf.id >= QURAN_COM_MOSHAF_OFFSET && moshaf.id < QURAN_COM_MOSHAF_LIMIT) return quranComIds.has(moshaf.id - QURAN_COM_MOSHAF_OFFSET);
  return readByFolder.has(normalizeFolder(moshaf.server));
}

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  return res.ok ? ((await res.json()) as unknown) : null;
}

// Only recitations the bundled list marks as synced are looked up, so callers can't point this at arbitrary URLs.
export async function getSurahTimings(moshaf: { id: number; server: string }, surah: number): Promise<SurahTimings | null> {
  const meta = getSurah(surah);
  if (!meta || !isSynced(moshaf)) return null;

  if (moshaf.id >= QURAN_COM_MOSHAF_OFFSET && moshaf.id < QURAN_COM_MOSHAF_LIMIT) {
    const json = (await getJson(`${QURAN_COM}/${moshaf.id - QURAN_COM_MOSHAF_OFFSET}/${surah}?segments=true`)) as { audio_file?: { timestamps?: unknown } } | null;
    return parseQuranComTimings(json?.audio_file?.timestamps, surah, meta.versesCount);
  }
  const read = readByFolder.get(normalizeFolder(moshaf.server));
  return parseMp3QuranTimings(await getJson(`${MP3QURAN}?surah=${surah}&read=${read}`), meta.versesCount);
}
