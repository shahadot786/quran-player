import { SURAHS } from "../surahs";
import { isSynced } from "./timings";
import type { Moshaf, Reciter, SourceMoshaf, SourceReciter } from "../types";

const PARTICLES = new Set(["al", "el", "ash", "as", "ad", "ar", "at", "az", "an", "bin", "ibn", "ben", "shaik", "shaikh", "sheikh", "shaykh", "imam", "qari"]);
const RIWAYAT: [RegExp, string][] = [
  [/warsh/i, "warsh"],
  [/qal[ou]{1,2}n/i, "qalun"],
  [/d[ou]{1,2}ri|dorai/i, "duri"],
  [/s[ou]{1,2}si/i, "susi"],
  [/sh?u'?ba|shoba/i, "shubah"],
  [/bazzi/i, "bazzi"],
  [/qunbul/i, "qunbul"],
  [/khalaf/i, "khalaf"],
  [/h[ie]sham/i, "hisham"],
  [/dhakwan|thakwan/i, "dhakwan"],
  [/kisa/i, "kisai"],
];

const SURNAME_TOLERANCE = 0.3;

function words(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/['`\u2018\u2019]/g, "")
    .replace(/\babd(?:[\s-]*(?:ul|ur|us|ar|as|al|el|ad|an))?[\s-]*/g, "abd")
    .replace(/\babu[\s-]+/g, "abu")
    .split(/[^a-z]+/)
    .filter((w) => w && !PARTICLES.has(w))
    .map((w) => (w.length > 4 ? w.replace(/^(?:al|el)|^a([^aeiou])(?=\1)/, "") : w));
}

function skeleton(word: string) {
  return word[0] + word.slice(1).replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1");
}

function spelling(word: string) {
  return word.replace(/y/g, "i").replace(/ou|oo/g, "u").replace(/ee/g, "i").replace(/(.)\1+/g, "$1");
}

function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) {
      next[j] = Math.min(row[j]! + 1, next[j - 1]! + 1, row[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length]!;
}

export function nameKey(name: string) {
  const parts = words(name);
  if (parts.length === 0) return name;
  const first = skeleton(parts[0]!);
  return parts.length === 1 ? first : `${first}|${skeleton(parts.at(-1)!)}`;
}

export function sameReciter(a: string, b: string) {
  if (nameKey(a) !== nameKey(b)) return false;
  const [x, y] = [spelling(words(a).at(-1) ?? a), spelling(words(b).at(-1) ?? b)];
  return distance(x, y) / Math.max(x.length, y.length) <= SURNAME_TOLERANCE;
}

export function variantKey(moshafName: string) {
  const riwaya = RIWAYAT.find(([pattern]) => pattern.test(moshafName))?.[1] ?? "hafs";
  const style = /mujaw+ad|mojaw+ad/i.test(moshafName) ? "mujawwad" : /mu'?al+im|mo'?l[ie]m|teach/i.test(moshafName) ? "muallim" : "murattal";
  return `${riwaya}:${style}`;
}

export function isComplete(moshaf: SourceMoshaf) {
  return SURAHS.every((s) => moshaf.surahs.includes(s.id));
}

function toMoshaf({ id, name, server, padded, downloadable }: SourceMoshaf): Moshaf {
  return { id, name, server, padded, downloadable, synced: isSynced({ id, server }) };
}

type Entry = { reciter: Reciter; variants: Map<string, number> };

export function mergeReciters(sources: SourceReciter[][]): Reciter[] {
  const entries: Entry[] = [];
  const byKey = new Map<string, Entry[]>();

  sources.forEach((reciters, sourceIndex) => {
    for (const source of reciters) {
      const moshafs = source.moshafs.filter(isComplete);
      if (moshafs.length === 0) continue;

      const key = nameKey(source.name);
      const bucket = byKey.get(key) ?? [];
      let entry = bucket.find((e) => sameReciter(e.reciter.name, source.name) && (sourceIndex > 0 || e.reciter.id === source.id));
      if (!entry) {
        entry = { reciter: { id: source.id, name: source.name, moshafs: [] }, variants: new Map() };
        entries.push(entry);
        byKey.set(key, [...bucket, entry]);
      }

      const covered = new Map(entry.variants);
      for (const source of moshafs) {
        const variant = variantKey(source.name);
        const moshaf = toMoshaf(source);
        const existing = covered.get(variant);
        if (existing === undefined) {
          entry.variants.set(variant, entry.reciter.moshafs.push(moshaf) - 1);
        } else if (moshaf.synced && !entry.reciter.moshafs[existing]!.synced) {
          // A later source only replaces a recitation that can't follow along when its own version can.
          entry.reciter.moshafs[existing] = moshaf;
        }
      }
    }
  });

  return entries
    // Array.sort is stable, so recitations keep their source order within each group.
    .map((e) => ({ ...e.reciter, moshafs: e.reciter.moshafs.toSorted((a, b) => Number(b.synced) - Number(a.synced)) }))
    .filter((r) => r.moshafs.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
