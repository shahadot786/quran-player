import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countSlices, decodeSlices, emptySlices, isFinished } from "@/lib/progress/slices";
import { useProgressStore } from "@/stores/progress-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStatsStore } from "@/stores/stats-store";
import { makeTrack } from "@/test/fixtures";
import { resetStores } from "@/test/reset-stores";

const holder = vi.hoisted(() => ({ audio: null as HTMLAudioElement | null }));
vi.mock("@/lib/audio", () => ({ getAudio: () => holder.audio }));

import { useAudioEngine } from "./use-audio-engine";

const DURATION = 600;
const TICK_MS = 250;
const heard = (surah: number) => decodeSlices(useProgressStore.getState().slices[surah] ?? "") ?? emptySlices();

// A stand-in for the audio element that jsdom can't play, driven by the test the way the browser would.
function createAudio() {
  const clock = { time: 0, paused: true, duration: DURATION, rate: 1 };
  const audio = new Audio();
  Object.defineProperties(audio, {
    currentTime: { get: () => clock.time, set: (value: number) => void (clock.time = value), configurable: true },
    paused: { get: () => clock.paused, configurable: true },
    duration: { get: () => clock.duration, configurable: true },
    playbackRate: { get: () => clock.rate, set: (value: number) => void (clock.rate = value), configurable: true },
  });
  audio.play = vi.fn(() => Promise.resolve());
  audio.pause = vi.fn();
  audio.load = vi.fn();
  return { audio, clock };
}

type Fake = ReturnType<typeof createAudio>;
let fake: Fake;

function startPlaying() {
  fake.audio.dispatchEvent(new Event("loadedmetadata"));
  fake.clock.paused = false;
  fake.audio.dispatchEvent(new Event("playing"));
}

// Plays from the current position to `to`, ticking like timeupdate does.
function playTo(to: number) {
  while (fake.clock.time < to) {
    vi.advanceTimersByTime(TICK_MS);
    fake.clock.time = Math.min(to, fake.clock.time + (TICK_MS / 1000) * fake.clock.rate);
    fake.audio.dispatchEvent(new Event("timeupdate"));
  }
}

function seekTo(time: number) {
  fake.clock.time = time;
  fake.audio.dispatchEvent(new Event("timeupdate"));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
  fake = createAudio();
  holder.audio = fake.audio;
  resetStores();
  usePlayerStore.setState({ queue: [makeTrack({ surah: 18 }), makeTrack({ surah: 36 })], index: 0 });
});

afterEach(() => vi.useRealTimers());

describe("progress while playing", () => {
  it("marks a surah finished and counts the time when it is played start to end", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(DURATION);
    fake.audio.dispatchEvent(new Event("pause"));

    expect(isFinished(heard(18))).toBe(true);
    const lifetime = useProgressStore.getState().lifetime[18]!;
    expect(lifetime.seconds).toBeGreaterThan(590);
    expect(lifetime.seconds).toBeLessThan(610);
    expect(lifetime.completions).toBe(1);
    expect(lifetime.reciters[1]!.name).toBe("Mishary Alafasy");
    expect(useStatsStore.getState().totalSeconds).toBeCloseTo(lifetime.seconds, 0);
  });

  it("saves progress every few seconds while playing, not only when it stops", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(30);
    expect(countSlices(heard(18))).toBeGreaterThan(0);
  });

  it("does not finish a surah by seeking to the end", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(30);
    seekTo(590);
    playTo(DURATION);
    fake.audio.dispatchEvent(new Event("pause"));

    expect(isFinished(heard(18))).toBe(false);
    expect(countSlices(heard(18))).toBeLessThan(20);
  });

  it("does not mark anything for position changes while paused", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    fake.audio.dispatchEvent(new Event("loadedmetadata"));
    seekTo(10);
    seekTo(10.5);
    seekTo(11);
    fake.audio.dispatchEvent(new Event("pause"));
    expect(useProgressStore.getState().slices).toEqual({});
  });

  it("does not raise progress when a part is replayed", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(60);
    fake.audio.dispatchEvent(new Event("pause"));
    const once = countSlices(heard(18));

    fake.clock.paused = false;
    seekTo(0);
    playTo(60);
    fake.audio.dispatchEvent(new Event("pause"));
    expect(countSlices(heard(18))).toBe(once);
  });

  it("attributes progress to the right surah when the track changes", () => {
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(30);
    usePlayerStore.setState({ index: 1 });
    fake.clock.time = 0;
    fake.audio.dispatchEvent(new Event("timeupdate"));
    playTo(30);
    fake.audio.dispatchEvent(new Event("pause"));

    expect(countSlices(heard(18))).toBeGreaterThan(0);
    expect(countSlices(heard(36))).toBeGreaterThan(0);
    expect(countSlices(heard(18))).toBeLessThan(countSlices(heard(36)) + 5);
  });

  it("counts at double speed by the audio that was heard", () => {
    useSettingsStore.setState({ rate: 2 });
    renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(DURATION);
    fake.audio.dispatchEvent(new Event("pause"));
    expect(isFinished(heard(18))).toBe(true);
    expect(useProgressStore.getState().lifetime[18]!.seconds).toBeLessThan(320);
  });

  it("keeps what was heard when the player goes away", () => {
    const { unmount } = renderHook(() => useAudioEngine(vi.fn()));
    startPlaying();
    playTo(20);
    unmount();
    expect(countSlices(heard(18))).toBeGreaterThan(0);
  });
});
