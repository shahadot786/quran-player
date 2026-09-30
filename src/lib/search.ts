import { BENGALI_SURAHS, fromBengaliDigits, getLocalizedReciterName } from "./bengali-data";
import type { Surah } from "./types";

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\u09C0]/g, "\u09BF")
    .replace(/[\u09C2]/g, "\u09C1")
    .replace(/[\u0988]/g, "\u0987")
    .replace(/[\u098A]/g, "\u0989")
    .replace(/[\u09A3]/g, "\u09A8")
    .replace(/[\u09B6\u09B7]/g, "\u09B8")
    .replace(/[\u09DF]/g, "\u09AF")
    .replace(/[^a-z0-9\u0600-\u06FF\u0980-\u09FF]+/g, "");
}

export function matchesSurah(surah: Surah, query: string) {
  const qLatin = fromBengaliDigits(query.trim());
  const q = normalize(query);
  if (!q) return true;

  if (/^\d+$/.test(qLatin)) return String(surah.id).startsWith(qLatin);

  const bn = BENGALI_SURAHS[surah.id];
  const candidates = [
    surah.name,
    surah.translation,
    surah.arabicName,
    bn?.name,
    bn?.translation,
  ].filter((f): f is string => Boolean(f));

  return candidates.some((field) => normalize(field).includes(q));
}

export function matchesName(name: string, query: string) {
  const q = normalize(query);
  if (!q) return true;

  const bn = getLocalizedReciterName(name, "bn");
  const candidates = [name, bn].filter((f): f is string => Boolean(f));
  return candidates.some((c) => normalize(c).includes(q));
}
