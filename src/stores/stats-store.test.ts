import { beforeEach, describe, expect, it } from "vitest";
import { makeTrack } from "@/test/fixtures";
import { useStatsStore } from "./stats-store";

const stats = () => useStatsStore.getState();

beforeEach(() => useStatsStore.setState(useStatsStore.getInitialState(), true));

describe("stats store", () => {
  it("accumulates total, per-day and per-reciter seconds", () => {
    const track = makeTrack({ reciterId: 7, reciterName: "Seven" });
    stats().addListening(30, track, new Date(2026, 8, 30, 10));
    stats().addListening(45, track, new Date(2026, 8, 30, 22));
    stats().addListening(20, track, new Date(2026, 9, 1, 8));
    expect(stats().totalSeconds).toBe(95);
    expect(stats().daily).toEqual({ "2026-09-30": 75, "2026-10-01": 20 });
    expect(stats().reciters[7]).toEqual({ name: "Seven", seconds: 95 });
  });

  it("ignores empty and negative deltas", () => {
    stats().addListening(0, makeTrack());
    stats().addListening(-5, makeTrack());
    expect(stats().totalSeconds).toBe(0);
    expect(stats().daily).toEqual({});
  });

  it("counts completions per track and remembers the last time", () => {
    stats().markCompleted(makeTrack({ surah: 1 }), 100);
    stats().markCompleted(makeTrack({ surah: 1 }), 200);
    stats().markCompleted(makeTrack({ surah: 2 }), 300);
    expect(stats().completed["10:1"]).toMatchObject({ surah: 1, count: 2, lastAt: 200 });
    expect(Object.keys(stats().completed)).toEqual(["10:1", "10:2"]);
  });

  it("resets", () => {
    stats().addListening(10, makeTrack());
    stats().markCompleted(makeTrack());
    stats().reset();
    expect(stats()).toMatchObject({ totalSeconds: 0, daily: {}, reciters: {}, completed: {} });
  });
});
