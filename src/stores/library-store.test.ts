import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTrack } from "@/test/fixtures";
import { HISTORY_LIMIT, useLibraryStore } from "./library-store";

const library = () => useLibraryStore.getState();

beforeEach(() => useLibraryStore.setState(useLibraryStore.getInitialState(), true));
afterEach(() => vi.useRealTimers());

describe("favorites", () => {
  it("toggles reciters on and off", () => {
    library().toggleFavoriteReciter({ id: 1, name: "A" });
    library().toggleFavoriteReciter({ id: 2, name: "B" });
    expect(library().favoriteReciters.map((r) => r.id)).toEqual([1, 2]);
    library().toggleFavoriteReciter({ id: 1, name: "A" });
    expect(library().favoriteReciters.map((r) => r.id)).toEqual([2]);
  });

  it("keeps favorite surahs sorted", () => {
    [36, 2, 18].forEach((id) => library().toggleFavoriteSurah(id));
    expect(library().favoriteSurahs).toEqual([2, 18, 36]);
    library().toggleFavoriteSurah(18);
    expect(library().favoriteSurahs).toEqual([2, 36]);
  });
});

describe("playlists", () => {
  it("creates a trimmed playlist with initial tracks", () => {
    const id = library().createPlaylist("  Morning  ", [makeTrack()]);
    expect(library().playlists).toHaveLength(1);
    expect(library().playlists[0]).toMatchObject({ id, name: "Morning", tracks: [makeTrack()] });
  });

  it("renames and deletes", () => {
    const id = library().createPlaylist("Old");
    library().renamePlaylist(id, " New ");
    expect(library().playlists[0]!.name).toBe("New");
    library().deletePlaylist(id);
    expect(library().playlists).toEqual([]);
  });

  it("adds a track once and reports duplicates or unknown playlists", () => {
    const id = library().createPlaylist("P");
    expect(library().addToPlaylist(id, makeTrack({ surah: 1 }))).toBe(true);
    expect(library().addToPlaylist(id, makeTrack({ surah: 1 }))).toBe(false);
    expect(library().addToPlaylist("missing", makeTrack({ surah: 2 }))).toBe(false);
    expect(library().playlists[0]!.tracks).toHaveLength(1);
  });

  it("removes and reorders tracks", () => {
    const id = library().createPlaylist("P", [1, 2, 3].map((surah) => makeTrack({ surah })));
    library().movePlaylistTrack(id, 0, 2);
    expect(library().playlists[0]!.tracks.map((t) => t.surah)).toEqual([2, 3, 1]);
    library().movePlaylistTrack(id, 2, 1);
    expect(library().playlists[0]!.tracks.map((t) => t.surah)).toEqual([2, 1, 3]);
    library().removeFromPlaylist(id, 0);
    expect(library().playlists[0]!.tracks.map((t) => t.surah)).toEqual([1, 3]);
  });

  it("ignores moves outside the list", () => {
    const id = library().createPlaylist("P", [1, 2].map((surah) => makeTrack({ surah })));
    library().movePlaylistTrack(id, 0, -1);
    library().movePlaylistTrack(id, 1, 2);
    expect(library().playlists[0]!.tracks.map((t) => t.surah)).toEqual([1, 2]);
  });

  it("bumps updatedAt on change", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const id = library().createPlaylist("P");
    vi.setSystemTime(5000);
    library().renamePlaylist(id, "Q");
    expect(library().playlists[0]).toMatchObject({ createdAt: 1000, updatedAt: 5000 });
  });
});

describe("history", () => {
  it("puts the latest play first and moves repeats to the top", () => {
    library().addHistory(makeTrack({ surah: 1 }), 100);
    library().addHistory(makeTrack({ surah: 2 }), 200);
    library().addHistory(makeTrack({ surah: 1 }), 300);
    expect(library().history.map((h) => [h.track.surah, h.playedAt])).toEqual([
      [1, 300],
      [2, 200],
    ]);
  });

  it("keeps only the most recent plays", () => {
    for (let i = 0; i < HISTORY_LIMIT + 10; i += 1) library().addHistory(makeTrack({ moshafId: i }), i);
    expect(library().history).toHaveLength(HISTORY_LIMIT);
    expect(library().history[0]!.track.moshafId).toBe(HISTORY_LIMIT + 9);
  });

  it("clears", () => {
    library().addHistory(makeTrack());
    library().clearHistory();
    expect(library().history).toEqual([]);
  });
});

describe("reset", () => {
  it("empties everything", () => {
    library().toggleFavoriteSurah(1);
    library().createPlaylist("P");
    library().addHistory(makeTrack());
    library().reset();
    expect(library()).toMatchObject({ favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] });
  });
});
