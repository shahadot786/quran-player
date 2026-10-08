import { SURAHS } from "../surahs";
import type { KhatmRound } from "@/stores/progress-store";
import { JUZS } from "./juz";
import { overallProgress, paceEstimate, paraProgress, surahState, type OverallProgress, type Pace, type ParaProgress, type SurahState } from "./calc";
import { sliceLookup } from "./lookup";
import { SLICE_COUNT, countSlices } from "./slices";

export type SurahCell = { id: number; state: SurahState; coverage: number };

export type ProgressModel = {
  overall: OverallProgress;
  paras: ParaProgress[];
  surahs: SurahCell[];
  pace: Pace | null;
};

export function buildProgressModel(input: { slices: Record<number, string>; paceSeconds: number; paceAyahs: number }): ProgressModel {
  const lookup = sliceLookup(input.slices);
  const overall = overallProgress(lookup);
  return {
    overall,
    paras: JUZS.map((juz) => paraProgress(juz.juz, lookup)),
    surahs: SURAHS.map((surah) => {
      const slices = lookup(surah.id);
      return { id: surah.id, state: surahState(slices), coverage: slices ? countSlices(slices) / SLICE_COUNT : 0 };
    }),
    pace: paceEstimate({ trackedSeconds: input.paceSeconds, trackedAyahs: input.paceAyahs, remainingAyahs: overall.ayahsTotal - overall.ayahsHeard }),
  };
}

export function mostUsedReciter(reciters: Record<number, { name: string; seconds: number }>) {
  const entries = Object.entries(reciters).map(([id, value]) => ({ id: Number(id), ...value }));
  return entries.reduce<(typeof entries)[number] | null>((best, entry) => (!best || entry.seconds > best.seconds ? entry : best), null);
}

const DAY_MS = 86_400_000;

// Calendar days, counting the first and the last, so a round finished the same day it began took one day.
export function khatmDays(round: KhatmRound) {
  const start = new Date(round.startedAt);
  const end = new Date(round.finishedAt);
  const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / DAY_MS);
  return Math.max(1, days + 1);
}
