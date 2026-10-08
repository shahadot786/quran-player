import type { Track } from "../types";
import { countSlices, emptySlices, markRange, type Slices } from "./slices";
import { ContinuityTracker } from "./tracker";

export type RecorderTrack = Pick<Track, "surah" | "moshafId" | "reciterId" | "reciterName">;

export type PlaybackBatch = {
  surah: number;
  reciter: { id: number; name: string };
  slices: Slices;
  seconds: number;
  duration: number;
};

// Collects what was heard in memory so the persisted store is written every few seconds instead of on every timeupdate.
export class PlaybackRecorder {
  private track: RecorderTrack | null = null;
  private key: string | null = null;
  private readonly tracker = new ContinuityTracker();
  private slices = emptySlices();
  private seconds = 0;
  private duration = 0;

  constructor(private readonly commit: (batch: PlaybackBatch) => void) {}

  setTrack(track: RecorderTrack | undefined) {
    const key = track ? `${track.moshafId}:${track.surah}` : null;
    if (key === this.key) return;
    this.flush();
    this.track = track ?? null;
    this.key = key;
    this.tracker.reset();
  }

  tick(position: number, duration: number, rate: number) {
    if (!this.track) return;
    const range = this.tracker.step(position, duration, rate);
    if (!range) return;
    this.slices = markRange(this.slices, range.from, range.to);
    this.duration = duration;
  }

  addSeconds(seconds: number) {
    if (this.track && seconds > 0) this.seconds += seconds;
  }

  flush() {
    const { track, slices, seconds, duration } = this;
    if (!track || (seconds <= 0 && countSlices(slices) === 0)) return;
    this.slices = emptySlices();
    this.seconds = 0;
    this.commit({ surah: track.surah, reciter: { id: track.reciterId, name: track.reciterName }, slices, seconds, duration });
  }
}
