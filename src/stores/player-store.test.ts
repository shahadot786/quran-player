import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeAudio } from "@/test/fake-audio";
import { makeTrack } from "@/test/fixtures";

const audio = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/audio", () => ({ getAudio: () => audio.current }));

import { useLibraryStore } from "./library-store";
import { consumeResume, selectCurrentTrack, usePlayerStore } from "./player-store";
import { useSettingsStore } from "./settings-store";

const player = () => usePlayerStore.getState();
const queue = [1, 2, 3].map((surah) => makeTrack({ surah }));
let fake: ReturnType<typeof createFakeAudio>;

beforeEach(() => {
  fake = createFakeAudio();
  audio.current = fake;
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useLibraryStore.setState(useLibraryStore.getInitialState(), true);
  consumeResume(0);
});

describe("playQueue", () => {
  it("loads the chosen track, applies the saved rate, records history and starts playback", () => {
    useSettingsStore.getState().setRate(1.5);
    player().playQueue(queue, 1);
    expect(selectCurrentTrack(player())?.surah).toBe(2);
    expect(fake.src).toBe("https://server.example/alafasy/002.mp3");
    expect(fake.playbackRate).toBe(1.5);
    expect(fake.play).toHaveBeenCalled();
    expect(player().status).toBe("loading");
    expect(useLibraryStore.getState().history.map((h) => h.track.surah)).toEqual([2]);
  });

  it("ignores an index outside the queue", () => {
    player().playQueue(queue, 5);
    expect(player().queue).toEqual([]);
    expect(fake.play).not.toHaveBeenCalled();
  });

  it("restores the saved position for a track that has one", () => {
    usePlayerStore.setState({ positions: { "10:2": { time: 120, duration: 600, updatedAt: 1, track: queue[1]! } } });
    player().playQueue(queue, 1);
    expect(player().currentTime).toBe(120);
    expect(player().duration).toBe(600);
    expect(consumeResume(600)).toBe(120);
    expect(consumeResume(600)).toBe(0);
  });
});

describe("resume points", () => {
  beforeEach(() => player().playQueue(queue, 0));

  it("saves the position once past the first second", () => {
    player().sync({ currentTime: 0.5, duration: 100 });
    player().savePosition();
    expect(player().positions).toEqual({});
    player().sync({ currentTime: 42, duration: 100 });
    player().savePosition();
    expect(player().positions["10:1"]).toMatchObject({ time: 42, duration: 100 });
  });

  it("clears the point instead of saving when the surah is nearly finished", () => {
    player().sync({ currentTime: 40, duration: 100 });
    player().savePosition();
    player().sync({ currentTime: 96, duration: 100 });
    player().savePosition();
    expect(player().positions).toEqual({});
  });

  it("pausing saves the position", () => {
    player().sync({ currentTime: 30, duration: 100 });
    player().pause();
    expect(fake.pause).toHaveBeenCalled();
    expect(player().positions["10:1"]?.time).toBe(30);
  });
});

describe("navigation", () => {
  beforeEach(() => player().playQueue(queue, 0));

  it("moves to the next track and stops at the end of the queue", () => {
    player().next();
    expect(player().index).toBe(1);
    player().next();
    player().next();
    expect(player().index).toBe(2);
    expect(fake.pause).toHaveBeenCalled();
  });

  it("wraps around when repeat-all is on", () => {
    useSettingsStore.setState({ repeat: "all" });
    player().jumpTo(2);
    player().next();
    expect(player().index).toBe(0);
  });

  it("restarts the current track when past the threshold, otherwise goes back", () => {
    player().next();
    player().sync({ currentTime: 10 });
    player().prev();
    expect(player().index).toBe(1);
    expect(fake.currentTime).toBe(0);
    player().sync({ currentTime: 1 });
    player().prev();
    expect(player().index).toBe(0);
  });

  it("does not jump to a missing index", () => {
    player().jumpTo(9);
    expect(player().index).toBe(0);
  });
});

describe("seek and skip", () => {
  it("clamps to the duration and to zero", () => {
    player().playQueue(queue, 0);
    player().sync({ duration: 100, currentTime: 90 });
    player().skip(30);
    expect(fake.currentTime).toBe(100);
    player().seek(-5);
    expect(player().currentTime).toBe(0);
    player().skip(10);
    expect(fake.currentTime).toBe(10);
  });
});

describe("queue editing", () => {
  beforeEach(() => player().playQueue(queue, 1));

  it("removes other tracks and keeps the current index pointing at the same track", () => {
    player().removeFromQueue(0);
    expect(player().queue.map((t) => t.surah)).toEqual([2, 3]);
    expect(player().index).toBe(0);
    player().removeFromQueue(1);
    expect(player().queue.map((t) => t.surah)).toEqual([2]);
  });

  it("refuses to remove the playing track", () => {
    player().removeFromQueue(1);
    expect(player().queue).toHaveLength(3);
  });
});

describe("handleEnded", () => {
  beforeEach(() => player().playQueue(queue, 0));

  it("advances automatically and forgets the finished track's resume point", () => {
    usePlayerStore.setState({ positions: { "10:1": { time: 90, duration: 100, updatedAt: 1, track: queue[0]! } } });
    player().handleEnded();
    expect(player().index).toBe(1);
    expect(player().positions["10:1"]).toBeUndefined();
  });

  it("stays put when auto-next is off", () => {
    useSettingsStore.setState({ autoNext: false });
    player().handleEnded();
    expect(player().index).toBe(0);
  });

  it("replays the same track on repeat-one", () => {
    useSettingsStore.setState({ repeat: "one" });
    fake.play.mockClear();
    player().handleEnded();
    expect(player().index).toBe(0);
    expect(fake.currentTime).toBe(0);
    expect(fake.play).toHaveBeenCalled();
  });

  it("honours an end-of-surah sleep timer", () => {
    player().setSleep({ mode: "end" });
    player().handleEnded();
    expect(player().sleep).toEqual({ mode: "off" });
    expect(player().index).toBe(0);
    expect(player().isPlaying).toBe(false);
  });
});

describe("restore and reset", () => {
  it("restores a snapshot paused, ready to resume", () => {
    player().playQueue(queue, 0);
    player().restore({ queue, index: 2, positions: {} });
    expect(fake.pause).toHaveBeenCalled();
    expect(fake.removeAttribute).toHaveBeenCalledWith("src");
    expect(player()).toMatchObject({ index: 2, isPlaying: false, status: "loading" });
    expect(fake.src).toContain("003.mp3");
  });

  it("clears the queue and stops audio on reset", () => {
    player().playQueue(queue, 0);
    player().reset();
    expect(player()).toMatchObject({ queue: [], index: 0, positions: {}, status: "idle", isPlaying: false });
    expect(fake.src).toBe("");
  });
});

describe("switching recitations", () => {
  it("can load without autoplay and resume at the same fraction of the new file", () => {
    player().playQueue(queue, 1, { autoplay: false, resumeRatio: 0.25 });
    expect(fake.play).not.toHaveBeenCalled();
    expect(useLibraryStore.getState().history).toEqual([]);
    expect(consumeResume(400)).toBe(100);
    expect(consumeResume(400)).toBe(0);
  });

  it("falls back to the saved time when the new duration is unknown", () => {
    usePlayerStore.setState({ positions: { "10:1": { time: 30, duration: 60, updatedAt: 1, track: queue[0]! } } });
    player().playQueue(queue, 0, { resumeRatio: 0.5 });
    expect(consumeResume(Number.NaN)).toBe(30);
  });
});

describe("queue management", () => {
  beforeEach(() => player().playQueue([1, 2, 3, 4].map((surah) => makeTrack({ surah })), 1));
  const surahs = () => player().queue.map((t) => t.surah);

  it("moves tracks and keeps the index on the playing track", () => {
    player().moveInQueue(1, 3);
    expect(surahs()).toEqual([1, 3, 4, 2]);
    expect(selectCurrentTrack(player())?.surah).toBe(2);
    player().moveInQueue(0, 3);
    expect(surahs()).toEqual([3, 4, 2, 1]);
    expect(player().index).toBe(2);
  });

  it("ignores moves outside the queue", () => {
    player().moveInQueue(0, -1);
    player().moveInQueue(3, 4);
    expect(surahs()).toEqual([1, 2, 3, 4]);
  });

  it("clears everything except the playing track", () => {
    player().clearQueue();
    expect(surahs()).toEqual([2]);
    expect(player().index).toBe(0);
  });

  it("shuffles the rest with the playing track first", () => {
    player().shuffleQueue();
    expect(surahs()[0]).toBe(2);
    expect([...surahs()].sort()).toEqual([1, 2, 3, 4]);
    expect(player().index).toBe(0);
  });
});

describe("A-B loop", () => {
  beforeEach(() => player().playQueue(queue, 0));

  it("sets both points in order, swapping when B comes before A", () => {
    player().sync({ currentTime: 40 });
    player().setLoopPoint("a");
    player().sync({ currentTime: 10 });
    player().setLoopPoint("b");
    expect(player().loop).toEqual({ a: 10, b: 40 });
  });

  it("drops the other point when both are too close", () => {
    player().sync({ currentTime: 10 });
    player().setLoopPoint("a");
    player().sync({ currentTime: 10.5 });
    player().setLoopPoint("b");
    expect(player().loop).toEqual({ a: null, b: 10.5 });
  });

  it("clears on demand and when another track loads", () => {
    player().sync({ currentTime: 5 });
    player().setLoopPoint("a");
    player().clearLoop();
    expect(player().loop).toEqual({ a: null, b: null });
    player().setLoopPoint("a");
    player().next();
    expect(player().loop).toEqual({ a: null, b: null });
  });

  it("wraps around to point A when seeking past point B or before point A", () => {
    player().sync({ duration: 100 });
    player().sync({ currentTime: 10 });
    player().setLoopPoint("a");
    player().sync({ currentTime: 20 });
    player().setLoopPoint("b");
    expect(player().loop).toEqual({ a: 10, b: 20 });

    player().seek(25);
    expect(player().currentTime).toBe(10);
    expect(fake.currentTime).toBe(10);

    player().seek(5);
    expect(player().currentTime).toBe(10);
    expect(fake.currentTime).toBe(10);

    player().seek(15);
    expect(player().currentTime).toBe(15);
    expect(fake.currentTime).toBe(15);
  });
});
