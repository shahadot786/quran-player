import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Bookmark = {
  surah: number;
  ayah: number;
  note: string;
  createdAt: number;
  updatedAt: number;
  /** Removed bookmarks stay as markers so a sync can't bring them back. */
  deletedAt: number | null;
};

export const NOTE_LIMIT = 2000;
export const bookmarkKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

type BookmarkState = {
  bookmarks: Record<string, Bookmark>;
  toggle: (surah: number, ayah: number, now?: number) => void;
  setNote: (surah: number, ayah: number, note: string, now?: number) => void;
  remove: (surah: number, ayah: number, now?: number) => void;
  restore: (bookmarks: Record<string, Bookmark>) => void;
  reset: () => void;
};

const fresh = (surah: number, ayah: number, now: number): Bookmark => ({ surah, ayah, note: "", createdAt: now, updatedAt: now, deletedAt: null });

export const isLive = (bookmark: Bookmark | undefined) => bookmark !== undefined && bookmark.deletedAt === null;

/** Saved bookmarks, most recently changed first. */
export const liveBookmarks = (bookmarks: Record<string, Bookmark>) =>
  Object.values(bookmarks)
    .filter((bookmark) => isLive(bookmark))
    .sort((a, b) => b.updatedAt - a.updatedAt);

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set) => ({
      bookmarks: {},
      toggle: (surah, ayah, now = Date.now()) =>
        set((s) => {
          const key = bookmarkKey(surah, ayah);
          const current = s.bookmarks[key];
          const base = current ?? fresh(surah, ayah, now);
          const next = isLive(current) ? { ...base, deletedAt: now, updatedAt: now } : { ...base, deletedAt: null, updatedAt: now };
          return { bookmarks: { ...s.bookmarks, [key]: next } };
        }),
      setNote: (surah, ayah, note, now = Date.now()) =>
        set((s) => {
          const key = bookmarkKey(surah, ayah);
          const existing = s.bookmarks[key];
          const current = existing && isLive(existing) ? existing : fresh(surah, ayah, now);
          return { bookmarks: { ...s.bookmarks, [key]: { ...current, note: note.trim().slice(0, NOTE_LIMIT), updatedAt: now } } };
        }),
      remove: (surah, ayah, now = Date.now()) =>
        set((s) => {
          const key = bookmarkKey(surah, ayah);
          const current = s.bookmarks[key];
          return current && isLive(current) ? { bookmarks: { ...s.bookmarks, [key]: { ...current, deletedAt: now, updatedAt: now } } } : s;
        }),
      restore: (bookmarks) => set({ bookmarks }),
      reset: () => set({ bookmarks: {} }),
    }),
    { name: "qp-bookmarks", skipHydration: true },
  ),
);

/** An ayah to scroll to once Live Quran shows its surah; set when a bookmark is opened. */
export const useAyahFocus = create<{ surah: number; ayah: number } | null>(() => null);
