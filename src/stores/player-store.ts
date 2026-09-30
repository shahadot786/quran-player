import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAudio } from "@/lib/audio";
import { trackKey, trackUrl } from "@/lib/audio-url";
import type { Track } from "@/lib/types";
import { moveItem, omitKey, shuffle } from "@/lib/utils";
import { useLibraryStore } from "./library-store";
import { useSettingsStore } from "./settings-store";

export const COMPLETE_RATIO = 0.95;
export const RESTART_THRESHOLD = 3;
export const MIN_LOOP_SECONDS = 1;

export type Position = { time: number; duration: number; updatedAt: number; track: Track };
export type PlayerStatus = "idle" | "loading" | "ready" | "error";
export type PlayerSnapshot = { queue: Track[]; index: number; positions: Record<string, Position> };
export type Loop = { a: number | null; b: number | null };
export type PlayOptions = { autoplay?: boolean; resumeRatio?: number };
export type SleepTimer = { mode: "off" } | { mode: "time"; endsAt: number } | { mode: "end" };

type PlayerState = {
  queue: Track[];
  index: number;
  positions: Record<string, Position>;
  isPlaying: boolean;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  sleep: SleepTimer;
  loop: Loop;
  playQueue: (queue: Track[], index?: number, options?: PlayOptions) => void;
  load: (autoplay: boolean, resumeRatio?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (index: number) => void;
  seek: (time: number) => void;
  skip: (delta: number) => void;
  removeFromQueue: (index: number) => void;
  moveInQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  setLoopPoint: (point: keyof Loop) => void;
  clearLoop: () => void;
  savePosition: () => void;
  clearPosition: (key: string) => void;
  setSleep: (sleep: SleepTimer) => void;
  handleEnded: () => void;
  restore: (snapshot: PlayerSnapshot) => void;
  reset: () => void;
  sync: (patch: Partial<Pick<PlayerState, "isPlaying" | "status" | "currentTime" | "duration">>) => void;
};

const NO_LOOP: Loop = { a: null, b: null };

let resumeAt = 0;
let resumeRatio: number | null = null;

export function consumeResume(duration: number) {
  const t = resumeRatio !== null && Number.isFinite(duration) ? resumeRatio * duration : resumeAt;
  resumeAt = 0;
  resumeRatio = null;
  return t;
}

export function selectCurrentTrack(s: Pick<PlayerState, "queue" | "index">): Track | undefined {
  return s.queue[s.index];
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: 0,
      positions: {},
      isPlaying: false,
      status: "idle",
      currentTime: 0,
      duration: 0,
      sleep: { mode: "off" },
      loop: NO_LOOP,

      playQueue: (queue, index = 0, { autoplay = true, resumeRatio } = {}) => {
        if (!queue[index]) return;
        get().savePosition();
        set({ queue, index });
        get().load(autoplay, resumeRatio);
      },

      load: (autoplay, ratio) => {
        const track = selectCurrentTrack(get());
        const audio = getAudio();
        if (!track || !audio) return;
        const saved = get().positions[trackKey(track)];
        resumeAt = saved?.time ?? 0;
        resumeRatio = ratio ?? null;
        const { rate } = useSettingsStore.getState();
        audio.src = trackUrl(track);
        audio.defaultPlaybackRate = rate;
        audio.playbackRate = rate;
        set({ status: "loading", currentTime: resumeAt, duration: saved?.duration ?? 0, loop: NO_LOOP });
        if (autoplay) {
          useLibraryStore.getState().addHistory(track);
          audio.play().catch(() => set({ isPlaying: false }));
        }
      },

      play: () => {
        const audio = getAudio();
        if (!audio || !selectCurrentTrack(get())) return;
        if (!audio.src) get().load(false);
        audio.play().catch(() => set({ isPlaying: false }));
      },

      pause: () => {
        getAudio()?.pause();
        get().savePosition();
      },

      toggle: () => (get().isPlaying ? get().pause() : get().play()),

      next: () => {
        const { index, queue } = get();
        const { repeat } = useSettingsStore.getState();
        get().savePosition();
        if (index < queue.length - 1) {
          set({ index: index + 1 });
          get().load(true);
        } else if (repeat === "all" && queue.length > 0) {
          set({ index: 0 });
          get().load(true);
        } else {
          get().pause();
        }
      },

      prev: () => {
        const { index, currentTime } = get();
        if (currentTime > RESTART_THRESHOLD || index === 0) {
          get().seek(0);
          return;
        }
        get().savePosition();
        set({ index: index - 1 });
        get().load(true);
      },

      jumpTo: (index) => {
        if (!get().queue[index]) return;
        get().savePosition();
        set({ index });
        get().load(true);
      },

      seek: (time) => {
        const audio = getAudio();
        const { duration: dur, loop } = get();
        const duration = dur || audio?.duration || 0;
        let clamped = Math.max(0, duration ? Math.min(time, duration) : time);
        if (loop.a !== null && loop.b !== null) {
          if (clamped >= loop.b || clamped < loop.a) {
            clamped = loop.a;
          }
        }
        if (audio) audio.currentTime = clamped;
        set({ currentTime: clamped });
      },

      skip: (delta) => get().seek(get().currentTime + delta),

      removeFromQueue: (index) => {
        const { queue, index: current } = get();
        if (index === current) return;
        set({ queue: queue.filter((_, i) => i !== index), index: index < current ? current - 1 : current });
      },

      moveInQueue: (from, to) => {
        const { queue, index } = get();
        const current = queue[index];
        const moved = moveItem(queue, from, to);
        set({ queue: moved, index: current ? moved.indexOf(current) : 0 });
      },

      clearQueue: () => {
        const current = selectCurrentTrack(get());
        set({ queue: current ? [current] : [], index: 0 });
      },

      shuffleQueue: () => {
        const { queue, index } = get();
        const current = queue[index];
        if (!current) return;
        set({ queue: [current, ...shuffle(queue.filter((_, i) => i !== index))], index: 0 });
      },

      setLoopPoint: (point) => {
        const loop = { ...get().loop, [point]: get().currentTime };
        if (loop.a !== null && loop.b !== null) {
          if (Math.abs(loop.b - loop.a) < MIN_LOOP_SECONDS) loop[point === "a" ? "b" : "a"] = null;
          else if (loop.b < loop.a) [loop.a, loop.b] = [loop.b, loop.a];
        }
        set({ loop });
      },

      clearLoop: () => set({ loop: NO_LOOP }),

      savePosition: () => {
        const { currentTime, duration } = get();
        const track = selectCurrentTrack(get());
        if (!track || currentTime < 1) return;
        const key = trackKey(track);
        if (duration && currentTime / duration >= COMPLETE_RATIO) {
          get().clearPosition(key);
          return;
        }
        set((s) => ({ positions: { ...s.positions, [key]: { time: currentTime, duration, updatedAt: Date.now(), track } } }));
      },

      clearPosition: (key) => set((s) => ({ positions: omitKey(s.positions, key) })),

      setSleep: (sleep) => set({ sleep }),

      handleEnded: () => {
        const track = selectCurrentTrack(get());
        if (track) get().clearPosition(trackKey(track));
        const { repeat, autoNext } = useSettingsStore.getState();
        if (get().sleep.mode === "end") {
          set({ sleep: { mode: "off" }, isPlaying: false });
          return;
        }
        if (repeat === "one") {
          get().seek(0);
          get().play();
          return;
        }
        if (autoNext) get().next();
      },

      restore: (snapshot) => {
        const audio = getAudio();
        audio?.pause();
        audio?.removeAttribute("src");
        audio?.load();
        set({ ...snapshot, isPlaying: false, status: "idle", currentTime: 0, duration: 0, sleep: { mode: "off" }, loop: NO_LOOP });
        if (selectCurrentTrack(get())) get().load(false);
      },

      reset: () => get().restore({ queue: [], index: 0, positions: {} }),

      sync: (patch) => set(patch),
    }),
    {
      name: "qp-player",
      skipHydration: true,
      partialize: (s) => ({ queue: s.queue, index: s.index, positions: s.positions }),
    },
  ),
);
