import { beforeEach, describe, expect, it } from "vitest";
import { liveBookmarks, NOTE_LIMIT, useBookmarkStore } from "./bookmark-store";

const store = () => useBookmarkStore.getState();

beforeEach(() => useBookmarkStore.setState(useBookmarkStore.getInitialState(), true));

describe("bookmark store", () => {
  it("bookmarks an ayah and takes it back, keeping a marker for sync", () => {
    store().toggle(18, 10, 1);
    expect(liveBookmarks(store().bookmarks)).toMatchObject([{ surah: 18, ayah: 10, note: "" }]);
    store().toggle(18, 10, 2);
    expect(liveBookmarks(store().bookmarks)).toEqual([]);
    expect(store().bookmarks["18:10"]).toMatchObject({ deletedAt: 2, updatedAt: 2 });
    store().toggle(18, 10, 3);
    expect(store().bookmarks["18:10"]).toMatchObject({ deletedAt: null, updatedAt: 3, createdAt: 1 });
  });

  it("saves a note, creating the bookmark if needed, trimmed and capped", () => {
    store().setNote(2, 255, "  Ayat al-Kursi  ", 5);
    expect(store().bookmarks["2:255"]).toMatchObject({ note: "Ayat al-Kursi", deletedAt: null, updatedAt: 5 });
    store().setNote(2, 255, "x".repeat(NOTE_LIMIT + 50), 6);
    expect(store().bookmarks["2:255"]!.note).toHaveLength(NOTE_LIMIT);
  });

  it("lists bookmarks most recently changed first", () => {
    store().toggle(1, 1, 1);
    store().toggle(2, 1, 3);
    store().setNote(1, 1, "first", 5);
    expect(liveBookmarks(store().bookmarks).map((b) => b.surah)).toEqual([1, 2]);
  });

  it("removes only a saved bookmark", () => {
    store().remove(3, 3, 1);
    expect(store().bookmarks).toEqual({});
    store().toggle(3, 3, 2);
    store().remove(3, 3, 4);
    expect(store().bookmarks["3:3"]).toMatchObject({ deletedAt: 4 });
  });
});
