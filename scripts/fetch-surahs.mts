import { mkdir, writeFile } from "node:fs/promises";

type QuranComChapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name: { name: string };
  verses_count: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
};

const SOURCE = "https://api.quran.com/api/v4/chapters?language=en";
const OUTPUT = new URL("../src/data/surahs.json", import.meta.url);

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Failed to fetch chapters: ${res.status}`);

const { chapters } = (await res.json()) as { chapters: QuranComChapter[] };
if (chapters.length !== 114) throw new Error(`Expected 114 chapters, got ${chapters.length}`);

const surahs = chapters.map((c) => ({
  id: c.id,
  name: c.name_simple,
  arabicName: c.name_arabic,
  translation: c.translated_name.name,
  versesCount: c.verses_count,
  revelation: c.revelation_place === "makkah" ? "meccan" : "medinan",
  revelationOrder: c.revelation_order,
}));

await mkdir(new URL(".", OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(surahs, null, 2)}\n`);
console.log(`Wrote ${surahs.length} surahs to ${OUTPUT.pathname}`);
