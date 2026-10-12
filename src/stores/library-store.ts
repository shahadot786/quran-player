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
/** The last add or removal of a favorite or playlist, so a sync can tell a removal from an item the other device never had. */
export type LibraryMark = { on: boolean; at: number };

export const markKey = { reciter: (id: number) => `reciter:${id}`, surah: (id: number) => `surah:${id}`, playlist: (id: string) => `playlist:${id}` };

type LibraryState = {
  favoriteReciters: FavoriteReciter[];
  favoriteSurahs: number[];
  playlists: Playlist[];
  history: HistoryEntry[];
  marks: Record<string, LibraryMark>;
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

const EMPTY = { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [], marks: {} };

const mark = (marks: Record<string, LibraryMark>, key: string, on: boolean) => ({ ...marks, [key]: { on, at: Date.now() } });

function updatePlaylist(playlists: Playlist[], id: string, update: (p: Playlist) => Partial<Playlist>) {
  return playlists.map((p) => (p.id === id ? { ...p, ...update(p), updatedAt: Date.now() } : p));
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      toggleFavoriteReciter: (reciter) =>
        set((s) => {
          const on = !s.favoriteReciters.some((r) => r.id === reciter.id);
          return {
            favoriteReciters: on ? [...s.favoriteReciters, reciter] : s.favoriteReciters.filter((r) => r.id !== reciter.id),
            marks: mark(s.marks, markKey.reciter(reciter.id), on),
          };
        }),
      toggleFavoriteSurah: (surah) =>
        set((s) => {
          const on = !s.favoriteSurahs.includes(surah);
          return {
            favoriteSurahs: on ? [...s.favoriteSurahs, surah].sort((a, b) => a - b) : s.favoriteSurahs.filter((id) => id !== surah),
            marks: mark(s.marks, markKey.surah(surah), on),
          };
        }),
      createPlaylist: (name, tracks = []) => {
        const now = Date.now();
        const id = crypto.randomUUID();
        set((s) => ({ playlists: [...s.playlists, { id, name: name.trim(), tracks, createdAt: now, updatedAt: now }] }));
        return id;
      },
      renamePlaylist: (id, name) => set((s) => ({ playlists: updatePlaylist(s.playlists, id, () => ({ name: name.trim() })) })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id), marks: mark(s.marks, markKey.playlist(id), false) })),
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
