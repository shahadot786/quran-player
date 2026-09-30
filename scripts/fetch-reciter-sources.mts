import { readFile, writeFile } from "node:fs/promises";

type Edition = { identifier: string; englishName: string; language: string; type: string };
type Entry = { id: number; identifier: string; name: string };

const EDITIONS = "https://api.alquran.cloud/v1/edition?format=audio";
const CDN = "https://cdn.islamic.network/quran/audio-surah/128";
const OUTPUT = new URL("../src/data/islamic-network.json", import.meta.url);
const ID_BASE = 200_000;
const SURAH_COUNT = 114;
const EXCLUDED = /translat|traduit|&/i;

async function exists(url: string) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { Range: "bytes=0-1" } });
      if (res.ok) return true;
      if (res.status === 404) return false;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  return false;
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

const previous: Entry[] = await readFile(OUTPUT, "utf8").then(JSON.parse, () => []);
const knownIds = new Map(previous.map((e) => [e.identifier, e.id]));
let nextId = Math.max(ID_BASE, ...previous.map((e) => e.id)) + 1;

const res = await fetch(EDITIONS);
if (!res.ok) throw new Error(`Failed to fetch editions: ${res.status}`);
const editions = ((await res.json()) as { data: Edition[] }).data.filter(
  (e) => e.type === "surahbysurah" && e.language === "ar" && !EXCLUDED.test(e.englishName),
);

const surahs = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1);
const complete = await pool(editions, 4, async (edition) => {
  const found = await pool(surahs, 8, (n) => exists(`${CDN}/${edition.identifier}/${n}.mp3`));
  const missing = found.filter((ok) => !ok).length;
  console.log(`${edition.identifier}: ${missing === 0 ? "complete" : `${missing} missing, skipped`}`);
  return missing === 0 ? edition : null;
});

const entries = complete
  .filter((e): e is Edition => e !== null)
  .sort((a, b) => a.identifier.localeCompare(b.identifier))
  .map((e) => ({ id: knownIds.get(e.identifier) ?? nextId++, identifier: e.identifier, name: e.englishName.trim() }));

await writeFile(OUTPUT, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} complete recitations to ${OUTPUT.pathname}`);
