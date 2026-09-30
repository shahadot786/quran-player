export const LIBRARY_TABS = ["favorites", "playlists", "history", "downloads"] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];
