import data from "@/data/juzs.json";
import { SURAHS } from "../surahs";

export type Portion = { surah: number; from: number; to: number };
export type Juz = { juz: number; portions: Portion[] };

export const JUZS = data as Juz[];
export const AYAH_TOTAL = SURAHS.reduce((total, surah) => total + surah.versesCount, 0);

export const getJuz = (number: number): Juz | undefined => JUZS.find((juz) => juz.juz === number);

export const parasOfSurah = (surah: number): number[] =>
  JUZS.filter((juz) => juz.portions.some((portion) => portion.surah === surah)).map((juz) => juz.juz);
