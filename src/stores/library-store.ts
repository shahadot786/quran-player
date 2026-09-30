import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackKey } from "@/lib/audio-url";
import type { Track } from "@/lib/types";
import { moveItem } from "@/lib/utils";

export const HISTORY_LIMIT = 100;

export type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
};

export type HistoryEntry = { track: Track; playedAt: number };
export type FavoriteReciter = { id: number; name: string };

type LibraryState = {
  favoriteReciters: FavoriteReciter[];
  favoriteSurahs: number[];
  playlists: Playlist[];
  history: HistoryEntry[];
  toggleFavoriteReciter: (reciter: FavoriteReciter) => void;
  toggleFavoriteSurah: (surah: number) => void;
  createPlaylist: (name: string, tracks?: Track[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, track: Track) => boolean;
  removeFromPlaylist: (id: string, index: number) => void;
  movePlaylistTrack: (id: string, from: number, to: number) => void;
  addHistory: (track: Track, playedAt?: number) => void;
  clearHistory: () => void;
  reset: () => void;
};

const EMPTY = { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] };

function updatePlaylist(playlists: Playlist[], id: string, update: (p: Playlist) => Partial<Playlist>) {
  return playlists.map((p) => (p.id === id ? { ...p, ...update(p), updatedAt: Date.now() } : p));
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      toggleFavoriteReciter: (reciter) =>
        set((s) => ({
          favoriteReciters: s.favoriteReciters.some((r) => r.id === reciter.id)
            ? s.favoriteReciters.filter((r) => r.id !== reciter.id)
            : [...s.favoriteReciters, reciter],
        })),
      toggleFavoriteSurah: (surah) =>
        set((s) => ({
          favoriteSurahs: s.favoriteSurahs.includes(surah)
            ? s.favoriteSurahs.filter((id) => id !== surah)
            : [...s.favoriteSurahs, surah].sort((a, b) => a - b),
        })),
      createPlaylist: (name, tracks = []) => {
        const now = Date.now();
        const id = crypto.randomUUID();
        set((s) => ({ playlists: [...s.playlists, { id, name: name.trim(), tracks, createdAt: now, updatedAt: now }] }));
        return id;
      },
      renamePlaylist: (id, name) => set((s) => ({ playlists: updatePlaylist(s.playlists, id, () => ({ name: name.trim() })) })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      addToPlaylist: (id, track) => {
        const playlist = get().playlists.find((p) => p.id === id);
        if (!playlist || playlist.tracks.some((t) => trackKey(t) === trackKey(track))) return false;
        set((s) => ({ playlists: updatePlaylist(s.playlists, id, (p) => ({ tracks: [...p.tracks, track] })) }));
        return true;
      },
      removeFromPlaylist: (id, index) =>
        set((s) => ({ playlists: updatePlaylist(s.playlists, id, (p) => ({ tracks: p.tracks.filter((_, i) => i !== index) })) })),
      movePlaylistTrack: (id, from, to) =>
        set((s) => ({ playlists: updatePlaylist(s.playlists, id, (p) => ({ tracks: moveItem(p.tracks, from, to) })) })),
      addHistory: (track, playedAt = Date.now()) =>
        set((s) => {
          const rest = s.history.filter((h) => trackKey(h.track) !== trackKey(track));
          return { history: [{ track, playedAt }, ...rest].slice(0, HISTORY_LIMIT) };
        }),
      clearHistory: () => set({ history: [] }),
      reset: () => set(EMPTY),
    }),
    { name: "qp-library", skipHydration: true },
  ),
);
