import data from "@/data/surahs.json";
import type { Surah } from "./types";

export const SURAHS = data as Surah[];

export function getSurah(id: number): Surah | undefined {
  return SURAHS[id - 1];
}
