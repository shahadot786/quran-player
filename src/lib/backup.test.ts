import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeAudio } from "@/test/fake-audio";
import { makeTrack } from "@/test/fixtures";

vi.mock("@/lib/audio", () => ({ getAudio: () => createFakeAudio() }));

import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStatsStore } from "@/stores/stats-store";
import { createBackup, importBackupFile, InvalidBackupError, parseBackup, resetAllData, restoreBackup } from "./backup";

function resetStores() {
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useLibraryStore.setState(useLibraryStore.getInitialState(), true);
  useStatsStore.setState(useStatsStore.getInitialState(), true);
}

function seedStores() {
  const track = makeTrack({ surah: 18 });
  useSettingsStore.setState({ rate: 1.25, repeat: "all", volume: 0.6 });
  usePlayerStore.setState({ queue: [track], index: 0, positions: { "10:18": { time: 300, duration: 900, updatedAt: 5, track } } });
  useLibraryStore.getState().toggleFavoriteReciter({ id: 1, name: "Mishary Alafasy" });
  useLibraryStore.getState().toggleFavoriteSurah(18);
  useLibraryStore.getState().createPlaylist("Fridays", [track]);
  useLibraryStore.getState().addHistory(track, 1000);
  useStatsStore.getState().addListening(600, track, new Date(2026, 8, 30));
  useStatsStore.getState().markCompleted(track, 2000);
}

beforeEach(resetStores);

describe("backup round trip", () => {
  it("exports every store and restores it into empty stores", () => {
    seedStores();
    const json = JSON.stringify(createBackup(new Date("2026-09-30T10:00:00Z")));
    resetStores();

    restoreBackup(parseBackup(json));

    expect(useSettingsStore.getState()).toMatchObject({ rate: 1.25, repeat: "all", volume: 0.6 });
    expect(usePlayerStore.getState().positions["10:18"]).toMatchObject({ time: 300, duration: 900 });
    expect(usePlayerStore.getState().queue.map((t) => t.surah)).toEqual([18]);
    expect(useLibraryStore.getState().favoriteReciters).toEqual([{ id: 1, name: "Mishary Alafasy" }]);
    expect(useLibraryStore.getState().favoriteSurahs).toEqual([18]);
    expect(useLibraryStore.getState().playlists[0]).toMatchObject({ name: "Fridays" });
    expect(useLibraryStore.getState().history).toHaveLength(1);
    expect(useStatsStore.getState()).toMatchObject({ totalSeconds: 600, daily: { "2026-09-30": 600 } });
    expect(useStatsStore.getState().completed["10:18"]).toMatchObject({ count: 1 });
  });

  it("does not export functions or transient playback state", () => {
    const backup = createBackup();
    expect(Object.keys(backup.data.player).sort()).toEqual(["index", "positions", "queue"]);
    expect(backup).toMatchObject({ app: "tilawah", version: 1 });
  });

  it("imports from a File", async () => {
    seedStores();
    const file = new File([JSON.stringify(createBackup())], "backup.json", { type: "application/json" });
    resetStores();
    await importBackupFile(file);
    expect(useLibraryStore.getState().favoriteSurahs).toEqual([18]);
  });
});

describe("parseBackup", () => {
  const valid = () => JSON.parse(JSON.stringify(createBackup())) as ReturnType<typeof createBackup>;

  it("rejects text that is not JSON", () => {
    expect(() => parseBackup("not json")).toThrow(InvalidBackupError);
  });

  it("rejects other apps and versions", () => {
    expect(() => parseBackup(JSON.stringify({ ...valid(), app: "other" }))).toThrow(InvalidBackupError);
    expect(() => parseBackup(JSON.stringify({ ...valid(), version: 2 }))).toThrow(InvalidBackupError);
  });

  it("rejects a backup with a missing or malformed section", () => {
    const missing = valid() as unknown as { data: Record<string, unknown> };
    delete missing.data.stats;
    expect(() => parseBackup(JSON.stringify(missing))).toThrow(InvalidBackupError);

    const badRate = valid();
    badRate.data.settings.rate = 9;
    expect(() => parseBackup(JSON.stringify(badRate))).toThrow(InvalidBackupError);
  });

  it("rejects tracks with an out-of-range surah or a non-https server", () => {
    seedStores();
    const badSurah = valid();
    badSurah.data.library.history[0]!.track.surah = 115;
    expect(() => parseBackup(JSON.stringify(badSurah))).toThrow(InvalidBackupError);

    const badServer = valid();
    badServer.data.player.queue[0]!.server = "http://insecure.example/";
    expect(() => parseBackup(JSON.stringify(badServer))).toThrow(InvalidBackupError);
  });

  it("rejects a player index that points outside the queue", () => {
    seedStores();
    const backup = valid();
    backup.data.player.index = 4;
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(InvalidBackupError);
  });

  it("leaves the stores untouched when the file is invalid", () => {
    seedStores();
    expect(() => parseBackup('{"app":"tilawah","version":1}')).toThrow();
    expect(useLibraryStore.getState().favoriteSurahs).toEqual([18]);
  });
});

describe("resetAllData", () => {
  it("clears listening data but keeps settings", () => {
    seedStores();
    resetAllData();
    expect(usePlayerStore.getState()).toMatchObject({ queue: [], positions: {} });
    expect(useLibraryStore.getState()).toMatchObject({ favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] });
    expect(useStatsStore.getState()).toMatchObject({ totalSeconds: 0, daily: {}, completed: {} });
    expect(useSettingsStore.getState().rate).toBe(1.25);
  });
});
