import { readFile, writeFile } from "node:fs/promises";
import { parseMp3QuranTimings, parseQuranComTimings } from "../src/lib/timings.ts";

type Surah = { id: number; versesCount: number };
type Read = { id: number; name: string; folder_url: string; soar_count: number };

const MP3QURAN = "https://www.mp3quran.net/api/v3";
const QURAN_COM = "https://api.quran.com/api/v4";
const OUTPUT = new URL("../src/data/synced-recitations.json", import.meta.url);
const SURAHS = JSON.parse(await readFile(new URL("../src/data/surahs.json", import.meta.url), "utf8")) as Surah[];
const CONCURRENCY = 8;
// The API re-validates each surah per request, so a recitation with a few bad surahs still helps for the rest.
const TOLERATED_UNUSABLE = 5;

async function getJson(url: string): Promise<unknown> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  return null;
}

async function pool<T, R>(items: T[], size: number, run: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await run(items[i]!);
      }
    }),
  );
  return results;
}

const normalizeFolder = (url: string) => `${url.replace(/^http:/, "https:").replace(/\/+$/, "")}/`;

const reads = ((await getJson(`${MP3QURAN}/ayat_timing/reads`)) as Read[]).filter((r) => r.soar_count === SURAHS.length);
const mp3quran = await pool(reads, 3, async (read) => {
  const valid = await pool(SURAHS, CONCURRENCY, async (surah) => {
    const rows = await getJson(`${MP3QURAN}/ayat_timing?surah=${surah.id}&read=${read.id}`);
    return parseMp3QuranTimings(rows, surah.versesCount) ? surah.id : null;
  });
  const missing = SURAHS.length - valid.filter(Boolean).length;
  console.log(`mp3quran read ${read.id} ${read.folder_url}: ${missing === 0 ? "all valid" : `${missing} unusable`}`);
  return { read: read.id, folder: normalizeFolder(read.folder_url), missing };
});

const recitations = ((await getJson(`${QURAN_COM}/resources/recitations`)) as { recitations: { id: number }[] }).recitations;
const quranCom = await pool(recitations, 1, async ({ id }) => {
  const valid = await pool(SURAHS, CONCURRENCY, async (surah) => {
    const json = (await getJson(`${QURAN_COM}/chapter_recitations/${id}/${surah.id}?segments=true`)) as { audio_file?: { timestamps?: unknown } } | null;
    return parseQuranComTimings(json?.audio_file?.timestamps, surah.id, surah.versesCount) ? surah.id : null;
  });
  const missing = SURAHS.length - valid.filter(Boolean).length;
  console.log(`quran.com recitation ${id}: ${missing === 0 ? "all valid" : `${missing} unusable`}`);
  return { id, missing };
});

const output = {
  mp3quran: mp3quran.filter((r) => r.missing <= TOLERATED_UNUSABLE).map(({ read, folder }) => ({ read, folder })),
  quranCom: quranCom.filter((r) => r.missing <= TOLERATED_UNUSABLE).map((r) => r.id),
};
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Synced: ${output.mp3quran.length} of ${mp3quran.length} mp3quran, ${output.quranCom.length} of ${quranCom.length} quran.com`);
console.log("Rejected mp3quran reads:", mp3quran.filter((r) => r.missing > TOLERATED_UNUSABLE).map((r) => `${r.read}(${r.missing})`).join(" "));
