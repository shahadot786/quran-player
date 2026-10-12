"use client";

import { NotebookPenIcon, PlayIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { NoteDialog } from "@/components/bookmarks/note-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { getLocalizedSurahName } from "@/lib/bengali-data";
import { SURAHS, getSurah } from "@/lib/surahs";
import { liveBookmarks, useAyahFocus, useBookmarkStore, type Bookmark } from "@/stores/bookmark-store";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

export function BookmarksPanel() {
  const t = useTranslations("bookmarks");
  const locale = useLocale();
  const n = useLocalizedNumber();
  const router = useRouter();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const current = usePlayerStore(selectCurrentTrack);
  const [noteFor, setNoteFor] = useState<{ surah: number; ayah: number; title: string } | null>(null);
  const list = liveBookmarks(bookmarks);

  if (list.length === 0) return <EmptyState>{t("empty")}</EmptyState>;

  const place = (bookmark: Bookmark) => t("place", { surah: getLocalizedSurahName(getSurah(bookmark.surah), locale), ayah: n(bookmark.ayah) });

  // Plays the surah with the recitation already loaded, in the same whole-Quran queue the progress page uses.
  const open = (bookmark: Bookmark) => {
    if (!current) return;
    useAyahFocus.setState({ surah: bookmark.surah, ayah: bookmark.ayah }, true);
    usePlayerStore.getState().playQueue(SURAHS.map((surah) => ({ ...current, surah: surah.id })), bookmark.surah - 1);
    router.push("/player");
  };

  const remove = (bookmark: Bookmark) => {
    useBookmarkStore.getState().remove(bookmark.surah, bookmark.ayah);
    toast(t("removed"), { action: { label: t("undo"), onClick: () => useBookmarkStore.getState().toggle(bookmark.surah, bookmark.ayah) } });
  };

  return (
    <section className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {list.map((bookmark) => (
          <li key={`${bookmark.surah}:${bookmark.ayah}`} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-medium">{place(bookmark)}</h3>
              <div className="flex gap-1">
                {current ? (
                  <Button variant="ghost" size="icon-sm" aria-label={t("play", { place: place(bookmark) })} onClick={() => open(bookmark)}>
                    <PlayIcon fill="currentColor" />
                  </Button>
                ) : (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/surahs/${bookmark.surah}`} onClick={() => useAyahFocus.setState({ surah: bookmark.surah, ayah: bookmark.ayah }, true)}>
                      {t("chooseReciter")}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("noteFor", { place: place(bookmark) })}
                  onClick={() => setNoteFor({ surah: bookmark.surah, ayah: bookmark.ayah, title: place(bookmark) })}
                >
                  <NotebookPenIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t("removeFor", { place: place(bookmark) })} onClick={() => remove(bookmark)}>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            {bookmark.note && <p className="text-sm whitespace-pre-line text-muted-foreground">{bookmark.note}</p>}
          </li>
        ))}
      </ul>
      <NoteDialog target={noteFor} onClose={() => setNoteFor(null)} />
    </section>
  );
}
