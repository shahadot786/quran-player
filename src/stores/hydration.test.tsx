import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { decodeSlices, isFinished } from "@/lib/progress/slices";
import { resetStores } from "@/test/reset-stores";
import { useHydrated, useRehydrateStores } from "./hydration";
import { useLibraryStore } from "./library-store";
import { usePlayerStore } from "./player-store";
import { useProgressStore } from "./progress-store";
import { useStatsStore } from "./stats-store";

const track = (surah: number, moshafId = 10) => ({
  reciterId: 1,
  reciterName: "Mishary Alafasi",
  moshafId,
  moshafName: "Hafs",
  server: "https://server.example/a/",
  padded: true,
  surah,
});

// What a browser that used the app for a few days would have saved.
const SAVED = {
  "qp-stats": {
    state: {
      totalSeconds: 5400,
      daily: { "2026-10-01": 1800, "2026-10-02": 3600 },
      reciters: { 1: { name: "Mishary Alafasi", seconds: 5400 } },
      completed: { "10:1": { surah: 1, reciterId: 1, count: 2, lastAt: 1_790_000_000_000 }, "10:112": { surah: 112, reciterId: 1, count: 1, lastAt: 1_790_100_000_000 } },
    },
    version: 0,
  },
  "qp-player": {
    state: {
      queue: [track(18)],
      index: 0,
      positions: { "10:18": { time: 300, duration: 1000, updatedAt: 1_790_200_000_000, track: track(18) } },
    },
    version: 0,
  },
  "qp-library": {
    state: {
      favoriteReciters: [],
      favoriteSurahs: [36],
      playlists: [],
      history: [{ track: track(67), playedAt: 1_790_150_000_000 }],
    },
    version: 0,
  },
};

function save(entries: Record<string, unknown>) {
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value));
}

const snapshotOfOldStores = () => ["qp-stats", "qp-player", "qp-library"].map((key) => localStorage.getItem(key));

beforeEach(() => {
  resetStores();
  useHydrated.setState(false);
});

async function openApp() {
  const view = renderHook(() => useRehydrateStores());
  await waitFor(() => expect(useHydrated.getState()).toBe(true));
  return view;
}

describe("first open after the progress feature ships", () => {
  it("builds progress from the saved stats, resume points and history", async () => {
    save(SAVED);
    await openApp();

    const { slices, lifetime, legacyImportedAt } = useProgressStore.getState();
    expect(isFinished(decodeSlices(slices[1]!)!)).toBe(true);
    expect(isFinished(decodeSlices(slices[112]!)!)).toBe(true);
    expect(decodeSlices(slices[18]!)).not.toBeNull();
    expect(lifetime[1]).toMatchObject({ completions: 2, lastAt: 1_790_000_000_000, source: "finished" });
    expect(lifetime[18]).toMatchObject({ lastAt: 1_790_200_000_000, source: "resume" });
    expect(lifetime[67]).toMatchObject({ lastAt: 1_790_150_000_000, source: "history" });
    expect(legacyImportedAt).not.toBeNull();
  });

  it("does not change the saved stats, player or library data in any way", async () => {
    save(SAVED);
    const before = snapshotOfOldStores();
    const stats = JSON.stringify(SAVED["qp-stats"].state);
    await openApp();
    await act(async () => {});

    expect(snapshotOfOldStores()).toEqual(before);
    expect(useStatsStore.getState().totalSeconds).toBe(5400);
    expect(useStatsStore.getState().daily).toEqual(JSON.parse(stats).daily);
    expect(usePlayerStore.getState().positions["10:18"]?.time).toBe(300);
    expect(useLibraryStore.getState().history).toHaveLength(1);
  });

  it("imports only once, even after the app is opened again", async () => {
    save(SAVED);
    const first = await openApp();
    const imported = useProgressStore.getState().legacyImportedAt;
    const slices = useProgressStore.getState().slices;
    const savedProgress = localStorage.getItem("qp-progress");
    expect(savedProgress).not.toBeNull();
    first.unmount();

    // A reload: memory starts empty, storage still holds what was saved, and the old stats still say what they said.
    useProgressStore.setState(useProgressStore.getInitialState(), true);
    useHydrated.setState(false);
    localStorage.setItem("qp-progress", savedProgress!);
    localStorage.setItem("qp-stats", JSON.stringify({ state: { ...SAVED["qp-stats"].state, completed: {} }, version: 0 }));
    await openApp();

    expect(useProgressStore.getState().legacyImportedAt).toBe(imported);
    expect(useProgressStore.getState().slices).toEqual(slices);
  });

  it("starts cleanly for someone with no saved data", async () => {
    await openApp();
    expect(useProgressStore.getState().slices).toEqual({});
    expect(useProgressStore.getState().legacyImportedAt).not.toBeNull();
  });
});
