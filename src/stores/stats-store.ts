import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackKey } from "@/lib/audio-url";
import { localDateKey } from "@/lib/format";
import type { Track } from "@/lib/types";

export type CompletedEntry = { surah: number; reciterId: number; count: number; lastAt: number };

type StatsState = {
  totalSeconds: number;
  daily: Record<string, number>;
  reciters: Record<number, { name: string; seconds: number }>;
  completed: Record<string, CompletedEntry>;
  addListening: (seconds: number, track: Track, now?: Date) => void;
  markCompleted: (track: Track, now?: number) => void;
  reset: () => void;
};

const EMPTY = { totalSeconds: 0, daily: {}, reciters: {}, completed: {} };

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      ...EMPTY,
      addListening: (seconds, track, now = new Date()) => {
        if (seconds <= 0) return;
        const day = localDateKey(now);
        set((s) => ({
          totalSeconds: s.totalSeconds + seconds,
          daily: { ...s.daily, [day]: (s.daily[day] ?? 0) + seconds },
          reciters: {
            ...s.reciters,
            [track.reciterId]: {
              name: track.reciterName,
              seconds: (s.reciters[track.reciterId]?.seconds ?? 0) + seconds,
            },
          },
        }));
      },
      markCompleted: (track, now = Date.now()) =>
        set((s) => {
          const key = trackKey(track);
          const prev = s.completed[key];
          return {
            completed: {
              ...s.completed,
              [key]: { surah: track.surah, reciterId: track.reciterId, count: (prev?.count ?? 0) + 1, lastAt: now },
            },
          };
        }),
      reset: () => set(EMPTY),
    }),
    { name: "qp-stats", skipHydration: true },
  ),
);
