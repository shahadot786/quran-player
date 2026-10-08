import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeAudio } from "@/test/fake-audio";
import { makeTrack } from "@/test/fixtures";

vi.mock("@/lib/audio", () => ({ getAudio: () => createFakeAudio() }));

import { decodeSlices, emptySlices, encodeSlices, fullSlices, isFinished, markRange } from "@/lib/progress/slices";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { useProgressStore } from "@/stores/progress-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStatsStore } from "@/stores/stats-store";
import { resetStores } from "@/test/reset-stores";
import { createBackup, importBackupFile, InvalidBackupError, parseBackup, resetAllData, restoreBackup } from "./backup";

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
  useProgressStore.getState().applyPlayback(
    { surah: 18, reciter: { id: 1, name: "Mishary Alafasy" }, slices: markRange(emptySlices(), 0, 0.4), seconds: 240, duration: 900 },
    3000,
  );
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

describe("progress in backups", () => {
  it("exports progress and restores it exactly, without importing earlier listening a second time", () => {
    seedStores();
    useProgressStore.getState().applyPlayback(
      { surah: 112, reciter: { id: 1, name: "Mishary Alafasy" }, slices: fullSlices(), seconds: 60, duration: 100 },
      4000,
    );
    const before = useProgressStore.getState();
    const json = JSON.stringify(createBackup(new Date("2026-10-08T10:00:00Z")));
    resetStores();

    restoreBackup(parseBackup(json));

    const after = useProgressStore.getState();
    expect(after.slices).toEqual(before.slices);
    expect(after.lifetime).toEqual(before.lifetime);
    expect(after.paceSeconds).toBe(before.paceSeconds);
    expect(isFinished(decodeSlices(after.slices[112]!)!)).toBe(true);
    expect(after.lifetime[112]!.completions).toBe(1);
    expect(after.legacyImportedAt).not.toBeNull();
  });

  it("rebuilds progress from an older backup that has none", () => {
    seedStores();
    const older = JSON.parse(JSON.stringify(createBackup()));
    delete older.data.progress;
    resetStores();

    restoreBackup(parseBackup(JSON.stringify(older)));

    const { slices, lifetime, legacyImportedAt } = useProgressStore.getState();
    expect(isFinished(decodeSlices(slices[18]!)!)).toBe(true);
    expect(lifetime[18]).toMatchObject({ completions: 1, source: "finished" });
    expect(legacyImportedAt).not.toBeNull();
  });

  it("replaces progress already on the device instead of mixing the two", () => {
    seedStores();
    const json = JSON.stringify(createBackup());
    useProgressStore.getState().applyPlayback(
      { surah: 55, reciter: { id: 2, name: "Other" }, slices: fullSlices(), seconds: 10, duration: 100 },
      9000,
    );
    restoreBackup(parseBackup(json));
    expect(useProgressStore.getState().slices[55]).toBeUndefined();
  });

  type Damage = (progress: {
    slices: Record<string, string>;
    lifetime: Record<string, { seconds: number }>;
    rounds: unknown[];
    currentRound: number;
  }) => void;

  it.each<[string, Damage]>([
    ["a surah outside 1 to 114", (p) => void (p.slices["200"] = encodeSlices(fullSlices()))],
    ["damaged slice data", (p) => void (p.slices["18"] = "not-slices")],
    ["a negative time", (p) => void (p.lifetime["18"]!.seconds = -5)],
    ["a missing round field", (p) => void (p.rounds = [{ number: 1 }])],
    ["a round counter below one", (p) => void (p.currentRound = 0)],
  ])("rejects a backup whose progress has %s", (_name, damage) => {
    seedStores();
    const backup = JSON.parse(JSON.stringify(createBackup()));
    damage(backup.data.progress);
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(InvalidBackupError);
  });

  it("clears progress with everything else on reset", () => {
    seedStores();
    resetAllData();
    expect(useProgressStore.getState()).toMatchObject({ slices: {}, lifetime: {}, rounds: [], currentRound: 1 });
  });
});
