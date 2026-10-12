import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localDateKey } from "@/lib/format";
import type { Track } from "@/lib/types";

/** One stretch of listening to one recitation on one day. */
export type ListeningSession = {
  id: string;
  day: string;
  startedAt: number;
  updatedAt: number;
  surah: number;
  reciterId: number;
  reciterName: string;
  moshafId: number;
  seconds: number;
};

export const SESSION_LIMIT = 2000;
export const SESSION_DAYS = 400;
// A pause longer than this starts a new session, so a day's list reads as separate sittings.
const SESSION_GAP_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type SessionState = {
  /** Newest first. */
  sessions: ListeningSession[];
  addListening: (seconds: number, track: Track, now?: number) => void;
  restore: (sessions: ListeningSession[]) => void;
  reset: () => void;
};

// Keeps the newest sessions within the window; used after every change so storage stays bounded.
export function trimSessions(sessions: ListeningSession[], now = Date.now()): ListeningSession[] {
  const oldest = localDateKey(new Date(now - SESSION_DAYS * DAY_MS));
  return sessions.filter((session) => session.day >= oldest).slice(0, SESSION_LIMIT);
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      addListening: (seconds, track, now = Date.now()) => {
        if (seconds <= 0) return;
        const day = localDateKey(new Date(now));
        set((state) => {
          const [latest, ...rest] = state.sessions;
          const continues =
            latest && latest.day === day && latest.moshafId === track.moshafId && latest.surah === track.surah && now - latest.updatedAt <= SESSION_GAP_MS;
          if (continues) return { sessions: [{ ...latest, seconds: latest.seconds + seconds, updatedAt: now }, ...rest] };
          const session: ListeningSession = {
            id: crypto.randomUUID(),
            day,
            startedAt: now - seconds * 1000,
            updatedAt: now,
            surah: track.surah,
            reciterId: track.reciterId,
            reciterName: track.reciterName,
            moshafId: track.moshafId,
            seconds,
          };
          return { sessions: trimSessions([session, ...state.sessions], now) };
        });
      },
      restore: (sessions) => set({ sessions: trimSessions([...sessions].sort((a, b) => b.startedAt - a.startedAt)) }),
      reset: () => set({ sessions: [] }),
    }),
    { name: "qp-sessions", skipHydration: true },
  ),
);
