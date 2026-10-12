export const LIBRARY_TABS = ["favorites", "playlists", "bookmarks", "history", "downloads"] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];
