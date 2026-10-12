import { beforeEach, describe, expect, it } from "vitest";
import { localDateKey } from "@/lib/format";
import { makeTrack } from "@/test/fixtures";
import { SESSION_LIMIT, trimSessions, useSessionStore, type ListeningSession } from "./session-store";

const store = () => useSessionStore.getState();
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

beforeEach(() => useSessionStore.setState(useSessionStore.getInitialState(), true));

describe("session store", () => {
  it("grows one session while the same recitation keeps playing", () => {
    const track = makeTrack({ surah: 18 });
    store().addListening(10, track, at(7, 9, 0));
    store().addListening(10, track, at(7, 9, 1));
    store().addListening(10, track, at(7, 9, 3));
    expect(store().sessions).toHaveLength(1);
    expect(store().sessions[0]).toMatchObject({ day: "2026-10-07", surah: 18, seconds: 30, startedAt: at(7, 9, 0) - 10_000 });
  });

  it("starts a new session for another surah, another recitation, a long pause or a new day", () => {
    const track = makeTrack({ surah: 1 });
    store().addListening(10, track, at(7, 9));
    store().addListening(10, makeTrack({ surah: 2 }), at(7, 9, 1));
    store().addListening(10, makeTrack({ surah: 2, moshafId: 99 }), at(7, 9, 2));
    store().addListening(10, makeTrack({ surah: 2, moshafId: 99 }), at(7, 9, 30));
    store().addListening(10, makeTrack({ surah: 2, moshafId: 99 }), at(8, 0, 1));
    expect(store().sessions.map((session) => session.day)).toEqual(["2026-10-08", "2026-10-07", "2026-10-07", "2026-10-07", "2026-10-07"]);
  });

  it("ignores empty time", () => {
    store().addListening(0, makeTrack());
    expect(store().sessions).toEqual([]);
  });

  it("keeps at most the newest sessions of the last 400 days", () => {
    const session = (day: string, startedAt: number): ListeningSession => ({
      id: `${day}-${startedAt}`, day, startedAt, updatedAt: startedAt, surah: 1, reciterId: 1, reciterName: "R", moshafId: 1, seconds: 1,
    });
    const now = at(12, 12);
    expect(trimSessions([session("2026-10-01", 2), session("2025-08-01", 1)], now).map((s) => s.day)).toEqual(["2026-10-01"]);
    const many = Array.from({ length: SESSION_LIMIT + 5 }, (_, i) => session("2026-10-10", SESSION_LIMIT + 5 - i));
    expect(trimSessions(many, now)).toHaveLength(SESSION_LIMIT);
  });

  it("restores sessions newest first and clears them on reset", () => {
    const one = { id: "a", day: localDateKey(new Date()), startedAt: 1, updatedAt: 1, surah: 1, reciterId: 1, reciterName: "R", moshafId: 1, seconds: 5 };
    const two = { ...one, id: "b", startedAt: 9 };
    store().restore([one, two]);
    expect(store().sessions.map((s) => s.id)).toEqual(["b", "a"]);
    store().reset();
    expect(store().sessions).toEqual([]);
  });
});
