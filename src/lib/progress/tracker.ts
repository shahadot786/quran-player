// timeupdate arrives a few times a second; a step longer than this at normal speed is a seek, not playback.
const TICK_SECONDS = 1.5;
const SLACK_SECONDS = 0.25;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export type PlayedRange = { from: number; to: number };

// Turns a stream of playback positions into the ranges that were played continuously.
export class ContinuityTracker {
  private previous: number | null = null;

  reset() {
    this.previous = null;
  }

  step(position: number, duration: number, rate: number): PlayedRange | null {
    if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return null;
    const previous = this.previous;
    this.previous = position;
    if (previous === null) return null;

    const delta = position - previous;
    const longestStep = TICK_SECONDS * (rate > 0 ? rate : 1) + SLACK_SECONDS;
    if (delta <= 0 || delta > longestStep) return null;
    return { from: clamp01(previous / duration), to: clamp01(position / duration) };
  }
}
