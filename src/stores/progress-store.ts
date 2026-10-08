import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isRoundComplete } from "@/lib/progress/calc";
import { legacyToSeeds, type LegacyInput, type LegacySource } from "@/lib/progress/legacy";
import { sliceLookup } from "@/lib/progress/lookup";
import type { PlaybackBatch } from "@/lib/progress/recorder";
import {
  SLICE_COUNT,
  countSlices,
  decodeSlices,
  emptySlices,
  encodeSlices,
  isFinished,
  unionSlices,
  type Slices,
} from "@/lib/progress/slices";
import { SURAHS } from "@/lib/surahs";

export type SurahLifetime = {
  seconds: number;
  completions: number;
  lastAt: number | null;
  reciters: Record<number, { name: string; seconds: number }>;
  source: LegacySource | null;
};

export type KhatmRound = { number: number; startedAt: number; finishedAt: number; seconds: number };

export type ProgressSnapshot = {
  /** What was heard in the current round, one encoded string per surah. */
  slices: Record<number, string>;
  /** Figures that carry on across rounds. */
  lifetime: Record<number, SurahLifetime>;
  rounds: KhatmRound[];
  currentRound: number;
  roundStartedAt: number | null;
  roundSeconds: number;
  /** Seconds of audio, and the ayahs inside it, that were new to the listener; the basis of the pace estimate. */
  paceSeconds: number;
  paceAyahs: number;
  legacyImportedAt: number | null;
};

type ProgressData = ProgressSnapshot;

type ProgressState = ProgressData & {
  applyPlayback: (batch: PlaybackBatch, now?: number) => void;
  importLegacy: (input: LegacyInput, now?: number) => void;
  reset: (now?: number) => void;
  /** Replaces everything with a saved snapshot; with none, starts empty so earlier listening can be imported again. */
  restore: (snapshot: ProgressSnapshot | null, now?: number) => void;
};

const EMPTY: ProgressData = {
  slices: {},
  lifetime: {},
  rounds: [],
  currentRound: 1,
  roundStartedAt: null,
  roundSeconds: 0,
  paceSeconds: 0,
  paceAyahs: 0,
  legacyImportedAt: null,
};

const blankLifetime = (): SurahLifetime => ({ seconds: 0, completions: 0, lastAt: null, reciters: {}, source: null });
const readSlices = (text: string | undefined): Slices => (text ? (decodeSlices(text) ?? emptySlices()) : emptySlices());

// When the last surah of a round is finished, the round is filed away and the next one starts empty.
function settleRound(data: ProgressData, now: number): ProgressData {
  if (!isRoundComplete(sliceLookup(data.slices))) return data;
  const round: KhatmRound = {
    number: data.currentRound,
    startedAt: data.roundStartedAt ?? now,
    finishedAt: now,
    seconds: data.roundSeconds,
  };
  return { ...data, rounds: [...data.rounds, round], currentRound: data.currentRound + 1, slices: {}, roundStartedAt: null, roundSeconds: 0 };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...EMPTY,

      applyPlayback: (batch, now = Date.now()) =>
        set((state) => {
          const meta = SURAHS[batch.surah - 1];
          if (!meta) return state;
          const before = readSlices(state.slices[batch.surah]);
          const merged = unionSlices(before, batch.slices);
          const gained = countSlices(merged) - countSlices(before);
          if (gained === 0 && batch.seconds <= 0) return state;

          const previous = state.lifetime[batch.surah] ?? blankLifetime();
          const known = previous.reciters[batch.reciter.id];
          const lifetime: SurahLifetime = {
            ...previous,
            seconds: previous.seconds + batch.seconds,
            lastAt: now,
            completions: previous.completions + (isFinished(merged) && !isFinished(before) ? 1 : 0),
            reciters:
              batch.seconds > 0
                ? { ...previous.reciters, [batch.reciter.id]: { name: batch.reciter.name, seconds: (known?.seconds ?? 0) + batch.seconds } }
                : previous.reciters,
          };

          const share = gained / SLICE_COUNT;
          const finishedNow = isFinished(merged) && !isFinished(before);
          const data: ProgressData = {
            ...state,
            slices: gained > 0 ? { ...state.slices, [batch.surah]: encodeSlices(merged) } : state.slices,
            lifetime: { ...state.lifetime, [batch.surah]: lifetime },
            roundStartedAt: state.roundStartedAt ?? now,
            roundSeconds: state.roundSeconds + batch.seconds,
            paceSeconds: state.paceSeconds + (batch.duration > 0 ? share * batch.duration : 0),
            paceAyahs: state.paceAyahs + share * meta.versesCount,
          };
          return finishedNow ? settleRound(data, now) : data;
        }),

      importLegacy: (input, now = Date.now()) =>
        set((state) => {
          if (state.legacyImportedAt !== null) return state;
          const seeds = legacyToSeeds(input);
          const slices = { ...state.slices };
          const lifetime = { ...state.lifetime };
          let earliest: number | null = null;

          for (const [key, seed] of Object.entries(seeds)) {
            const surah = Number(key);
            if (countSlices(seed.slices) > 0) slices[surah] = encodeSlices(unionSlices(readSlices(slices[surah]), seed.slices));
            const existing = lifetime[surah] ?? blankLifetime();
            const reciters = { ...seed.reciters };
            for (const [id, entry] of Object.entries(existing.reciters)) reciters[Number(id)] = entry;
            lifetime[surah] = {
              ...existing,
              completions: existing.completions + seed.completions,
              lastAt: Math.max(existing.lastAt ?? 0, seed.lastAt ?? 0) || null,
              reciters,
              source: existing.source ?? seed.source,
            };
            if (seed.lastAt !== null) earliest = Math.min(earliest ?? seed.lastAt, seed.lastAt);
          }

          const data: ProgressData = { ...state, slices, lifetime, roundStartedAt: state.roundStartedAt ?? earliest, legacyImportedAt: now };
          return settleRound(data, now);
        }),

      reset: (now = Date.now()) => set({ ...EMPTY, legacyImportedAt: now }),

      restore: (snapshot, now = Date.now()) => set(snapshot ? { ...snapshot, legacyImportedAt: snapshot.legacyImportedAt ?? now } : { ...EMPTY }),
    }),
    { name: "qp-progress", version: 1, skipHydration: true },
  ),
);
