import { readFile, writeFile } from "node:fs/promises";

type ApiJuz = { juz_number: number; verse_mapping: Record<string, string> };
type Surah = { id: number; versesCount: number };

const SOURCE = "https://api.quran.com/api/v4/juzs";
const OUTPUT = new URL("../src/data/juzs.json", import.meta.url);
const JUZ_COUNT = 30;
const AYAH_COUNT = 6236;

const surahs = JSON.parse(await readFile(new URL("../src/data/surahs.json", import.meta.url), "utf8")) as Surah[];

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Failed to fetch juzs: ${res.status}`);
const { juzs } = (await res.json()) as { juzs: ApiJuz[] };

// The API lists every para twice; keep one copy and require the copies to agree.
const unique = new Map<number, ApiJuz>();
for (const juz of juzs) {
  const first = unique.get(juz.juz_number);
  if (first && JSON.stringify(first.verse_mapping) !== JSON.stringify(juz.verse_mapping)) {
    throw new Error(`Para ${juz.juz_number} has two different definitions`);
  }
  unique.set(juz.juz_number, first ?? juz);
}
if (unique.size !== JUZ_COUNT) throw new Error(`Expected ${JUZ_COUNT} paras, got ${unique.size}`);

const output = [...unique.values()]
  .sort((a, b) => a.juz_number - b.juz_number)
  .map((juz) => ({
    juz: juz.juz_number,
    portions: Object.entries(juz.verse_mapping)
      .map(([surah, range]) => {
        const [from, to] = range.split("-").map(Number) as [number, number];
        return { surah: Number(surah), from, to };
      })
      .sort((a, b) => a.surah - b.surah),
  }));

const seen = new Set<string>();
for (const { juz, portions } of output) {
  for (const { surah, from, to } of portions) {
    const meta = surahs[surah - 1];
    if (!meta || from < 1 || to > meta.versesCount || from > to) throw new Error(`Para ${juz}: bad range ${surah}:${from}-${to}`);
    for (let ayah = from; ayah <= to; ayah += 1) {
      const key = `${surah}:${ayah}`;
      if (seen.has(key)) throw new Error(`Ayah ${key} is in more than one para`);
      seen.add(key);
    }
  }
}
if (seen.size !== AYAH_COUNT) throw new Error(`Expected ${AYAH_COUNT} ayahs, got ${seen.size}`);

await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.length} paras covering ${seen.size} ayahs to ${OUTPUT.pathname}`);
