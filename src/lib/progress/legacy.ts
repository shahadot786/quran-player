import { SURAHS } from "../surahs";
import { emptySlices, fullSlices, markUpTo, unionSlices, type Slices } from "./slices";

type LegacyTrack = { surah: number; reciterId: number; reciterName: string };

// Structural copies of what stats, player and library already store, so this stays free of the stores themselves.
export type LegacyInput = {
  completed: Record<string, { surah: number; reciterId: number; count: number; lastAt: number }>;
  reciters: Record<number, { name: string }>;
  positions: Record<string, { time: number; duration: number; updatedAt: number; track: LegacyTrack }>;
  history: { track: LegacyTrack; playedAt: number }[];
};

export type LegacySource = "finished" | "resume" | "history";
export type LegacySeed = {
  slices: Slices;
  completions: number;
  lastAt: number | null;
  reciters: Record<number, { name: string; seconds: number }>;
  source: LegacySource;
};

const validSurah = (surah: number) => Number.isInteger(surah) && surah >= 1 && surah <= SURAHS.length;
const latest = (a: number | null, b: number) => (a === null ? b : Math.max(a, b));

// Reads what the app recorded before progress existed. Finished and last-listened facts are exact; a resume point only shows how far the listener got.
export function legacyToSeeds(input: LegacyInput): Record<number, LegacySeed> {
  const seeds: Record<number, LegacySeed> = {};
  const ensure = (surah: number, source: LegacySource): LegacySeed =>
    (seeds[surah] ??= { slices: emptySlices(), completions: 0, lastAt: null, reciters: {}, source });
  const addReciter = (seed: LegacySeed, id: number, name: string | undefined) => {
    seed.reciters[id] ??= { name: name ?? String(id), seconds: 0 };
    if (name && seed.reciters[id]!.name === String(id)) seed.reciters[id]!.name = name;
  };
  const nameFor = (id: number) => input.reciters[id]?.name;

  for (const entry of Object.values(input.completed)) {
    if (!validSurah(entry.surah)) continue;
    const seed = ensure(entry.surah, "finished");
    seed.slices = fullSlices();
    seed.source = "finished";
    seed.completions += entry.count;
    seed.lastAt = latest(seed.lastAt, entry.lastAt);
    addReciter(seed, entry.reciterId, nameFor(entry.reciterId));
  }

  for (const position of Object.values(input.positions)) {
    const { surah, reciterId, reciterName } = position.track;
    if (!validSurah(surah)) continue;
    const seed = ensure(surah, "resume");
    if (seed.source !== "finished") {
      const ratio = position.duration > 0 ? Math.min(1, position.time / position.duration) : 0;
      seed.slices = unionSlices(seed.slices, markUpTo(emptySlices(), ratio));
      seed.source = "resume";
    }
    seed.lastAt = latest(seed.lastAt, position.updatedAt);
    addReciter(seed, reciterId, nameFor(reciterId) ?? reciterName);
  }

  for (const { track, playedAt } of input.history) {
    if (!validSurah(track.surah)) continue;
    const seed = ensure(track.surah, "history");
    seed.lastAt = latest(seed.lastAt, playedAt);
    addReciter(seed, track.reciterId, nameFor(track.reciterId) ?? track.reciterName);
  }

  return seeds;
}
