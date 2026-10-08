import { describe, expect, it, vi } from "vitest";
import { PlaybackRecorder, type PlaybackBatch } from "./recorder";
import { countSlices } from "./slices";

const track = (surah: number, moshafId = 10) => ({ surah, moshafId, reciterId: 1, reciterName: "Mishary Alafasi" });
const DURATION = 100;

function setup() {
  const commit = vi.fn<(batch: PlaybackBatch) => void>();
  return { commit, recorder: new PlaybackRecorder(commit) };
}

function playSeconds(recorder: PlaybackRecorder, from: number, to: number) {
  for (let t = from; t <= to; t += 0.25) {
    recorder.tick(t, DURATION, 1);
    recorder.addSeconds(0.25);
  }
}

describe("PlaybackRecorder", () => {
  it("collects heard slices and seconds, and hands them over on flush", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    playSeconds(recorder, 0, 10);
    expect(commit).not.toHaveBeenCalled();

    recorder.flush();
    expect(commit).toHaveBeenCalledTimes(1);
    const batch = commit.mock.calls[0]![0];
    expect(batch).toMatchObject({ surah: 18, reciter: { id: 1, name: "Mishary Alafasi" }, duration: DURATION });
    expect(countSlices(batch.slices)).toBe(20);
    expect(batch.seconds).toBeCloseTo(10.25, 6);
  });

  it("starts empty after a flush and does nothing when there is nothing to hand over", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    playSeconds(recorder, 0, 4);
    recorder.flush();
    recorder.flush();
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("hands over the previous track's data when the track changes, and attributes it correctly", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    playSeconds(recorder, 0, 6);
    recorder.setTrack(track(36));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit.mock.calls[0]![0].surah).toBe(18);

    playSeconds(recorder, 0, 3);
    recorder.flush();
    expect(commit.mock.calls[1]![0].surah).toBe(36);
  });

  it("treats the same surah with a different recitation as a new track", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18, 10));
    playSeconds(recorder, 0, 5);
    recorder.setTrack(track(18, 11));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("keeps the same track when told the same thing again", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    playSeconds(recorder, 0, 5);
    recorder.setTrack(track(18));
    expect(commit).not.toHaveBeenCalled();
  });

  it("does not count seeks, but still counts the time spent", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    playSeconds(recorder, 0, 5);
    playSeconds(recorder, 60, 65);
    recorder.flush();
    const batch = commit.mock.calls[0]![0];
    expect(countSlices(batch.slices)).toBe(20);
    expect(batch.seconds).toBeCloseTo(10.5, 6);
  });

  it("drops the previous position when the track changes so a new track never inherits it", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    recorder.tick(50, DURATION, 1);
    recorder.setTrack(track(36));
    recorder.tick(50.25, DURATION, 1);
    recorder.flush();
    expect(commit).not.toHaveBeenCalled();
  });

  it("ignores time and ticks when nothing is playing", () => {
    const { recorder, commit } = setup();
    recorder.addSeconds(5);
    recorder.tick(1, DURATION, 1);
    recorder.tick(1.25, DURATION, 1);
    recorder.flush();
    recorder.setTrack(undefined);
    expect(commit).not.toHaveBeenCalled();
  });

  it("ignores empty and negative time", () => {
    const { recorder, commit } = setup();
    recorder.setTrack(track(18));
    recorder.addSeconds(0);
    recorder.addSeconds(-3);
    recorder.flush();
    expect(commit).not.toHaveBeenCalled();
  });
});
