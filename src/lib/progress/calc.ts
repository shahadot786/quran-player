import { SURAHS } from "../surahs";
import { AYAH_TOTAL, JUZS, getJuz } from "./juz";
import { FINISHED_RATIO, SLICE_COUNT, countSlices, emptySlices, isFinished, rangeCoverage, type Slices } from "./slices";

export type SliceLookup = (surah: number) => Slices | undefined;
export type SurahState = "not-started" | "in-progress" | "finished";

export const MIN_PACE_SECONDS = 600;
export const MIN_PACE_AYAHS = 50;

// Allows for floating-point error when a portion is exactly 95% heard.
const EPSILON = 1e-9;

export function surahState(slices: Slices | undefined): SurahState {
  if (!slices || countSlices(slices) === 0) return "not-started";
  return isFinished(slices) ? "finished" : "in-progress";
}

export type ParaProgress = { juz: number; percent: number; finished: boolean; exact: boolean; surahs: number[] };

// Maps a surah's slices evenly onto its ayahs, so a para that cuts through a surah is an estimate unless that surah is settled.
export function paraProgress(number: number, lookup: SliceLookup): ParaProgress {
  const juz = getJuz(number);
  if (!juz) return { juz: number, percent: 0, finished: false, exact: true, surahs: [] };

  let weighted = 0;
  let ayahs = 0;
  let finished = true;
  let exact = true;
  for (const { surah, from, to } of juz.portions) {
    const verses = SURAHS[surah - 1]!.versesCount;
    const slices = lookup(surah) ?? emptySlices();
    const coverage = rangeCoverage(slices, ((from - 1) / verses) * SLICE_COUNT, (to / verses) * SLICE_COUNT);
    const count = to - from + 1;
    weighted += coverage * count;
    ayahs += count;
    if (coverage < FINISHED_RATIO - EPSILON) finished = false;
    const wholeSurah = from === 1 && to === verses;
    if (!wholeSurah && countSlices(slices) > 0 && !isFinished(slices)) exact = false;
  }
  return { juz: number, percent: weighted / ayahs, finished, exact, surahs: juz.portions.map((portion) => portion.surah) };
}

export type OverallProgress = {
  percent: number;
  ayahsHeard: number;
  ayahsTotal: number;
  surahsStarted: number;
  surahsFinished: number;
  parasFinished: number;
};

export function overallProgress(lookup: SliceLookup): OverallProgress {
  let heard = 0;
  let surahsStarted = 0;
  let surahsFinished = 0;
  for (const surah of SURAHS) {
    const slices = lookup(surah.id);
    const count = slices ? countSlices(slices) : 0;
    heard += (count / SLICE_COUNT) * surah.versesCount;
    if (count > 0) surahsStarted += 1;
    if (slices && isFinished(slices)) surahsFinished += 1;
  }
  const parasFinished = JUZS.filter((juz) => paraProgress(juz.juz, lookup).finished).length;
  return { percent: heard / AYAH_TOTAL, ayahsHeard: Math.round(heard), ayahsTotal: AYAH_TOTAL, surahsStarted, surahsFinished, parasFinished };
}

export const isRoundComplete = (lookup: SliceLookup) => SURAHS.every((surah) => {
  const slices = lookup(surah.id);
  return slices !== undefined && isFinished(slices);
});

export type Pace = { secondsPerAyah: number; secondsLeft: number };

// Uses only listening tracked since the feature shipped, and stays hidden until it is a fair sample.
export function paceEstimate(input: { trackedSeconds: number; trackedAyahs: number; remainingAyahs: number }): Pace | null {
  const { trackedSeconds, trackedAyahs, remainingAyahs } = input;
  if (trackedSeconds < MIN_PACE_SECONDS || trackedAyahs < MIN_PACE_AYAHS) return null;
  const secondsPerAyah = trackedSeconds / trackedAyahs;
  return { secondsPerAyah, secondsLeft: Math.max(0, remainingAyahs) * secondsPerAyah };
}
