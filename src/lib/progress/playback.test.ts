import { describe, expect, it } from "vitest";
import { countSlices, emptySlices, isFinished, markRange } from "./slices";
import { ContinuityTracker } from "./tracker";

const DURATION = 600;
const TICK_SECONDS = 0.25;

// Plays like the audio element does: positions arrive about four times a second and advance with the speed.
function play(positions: number[], rate = 1, slices = emptySlices(), tracker = new ContinuityTracker()) {
  let heard = slices;
  for (const position of positions) {
    const range = tracker.step(position, DURATION, rate);
    if (range) heard = markRange(heard, range.from, range.to);
  }
  return heard;
}

const run = (from: number, to: number, rate = 1) => {
  const step = TICK_SECONDS * rate;
  const out: number[] = [];
  for (let t = from; t < to; t += step) out.push(t);
  out.push(to);
  return out;
};

describe("playing through a surah", () => {
  it.each([0.5, 1, 1.5, 2])("finishes it when it is played start to end at %sx", (rate) => {
    expect(isFinished(play(run(0, DURATION, rate), rate))).toBe(true);
  });

  it("marks every slice when played start to end", () => {
    expect(countSlices(play(run(0, DURATION)))).toBe(200);
  });

  it("does not finish by seeking to the end of an unheard surah", () => {
    const heard = play([...run(0, 30), ...run(590, DURATION)]);
    expect(isFinished(heard)).toBe(false);
    expect(countSlices(heard)).toBeLessThan(25);
  });

  it("does not count a skip that lands inside a playing run", () => {
    const heard = play([...run(0, 60), ...run(300, 360)]);
    expect(countSlices(heard)).toBeLessThanOrEqual(42);
    expect(countSlices(heard)).toBeGreaterThanOrEqual(38);
  });
});

describe("repeating", () => {
  it("does not raise progress when a loop plays the same part again and again", () => {
    const once = play(run(100, 160));
    const tracker = new ContinuityTracker();
    let looped = emptySlices();
    for (let pass = 0; pass < 10; pass += 1) looped = play(run(100, 160), 1, looped, tracker);
    expect(countSlices(looped)).toBe(countSlices(once));
  });

  it("adds up what was heard across separate sessions", () => {
    const first = play(run(0, 300));
    const second = play(run(300, DURATION), 1, first, new ContinuityTracker());
    expect(isFinished(second)).toBe(true);
    expect(isFinished(first)).toBe(false);
  });
});
