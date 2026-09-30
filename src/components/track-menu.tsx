"use client";

import { BookOpenIcon, CheckIcon, DownloadIcon, EllipsisIcon, HeartIcon, ListPlusIcon, MicVocalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trackKey } from "@/lib/audio-url";
import type { Track } from "@/lib/types";
import { useDownloadsStore } from "@/stores/downloads-store";
import { useLibraryStore } from "@/stores/library-store";
import { DownloadDialog } from "./download-dialog";
import { PlaylistDialog } from "./playlist-dialog";

export function TrackMenu({ track, name, context }: { track: Track; name: string; context: "reciter" | "surah" | "other" }) {
  const t = useTranslations("track");
  const tp = useTranslations("playlists");
  const td = useTranslations("downloads");
  const playlists = useLibraryStore((s) => s.playlists);
  const isFavorite = useLibraryStore((s) => s.favoriteSurahs.includes(track.surah));
  const downloaded = useDownloadsStore((s) => Boolean(s.records[trackKey(track)]));
  const downloading = useDownloadsStore((s) => s.progress[trackKey(track)] !== undefined);
  const canDownload = track.downloadable !== false;
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const addTo = (id: string, playlistName: string) => {
    const added = useLibraryStore.getState().addToPlaylist(id, track);
    toast(added ? tp("added", { name: playlistName }) : tp("alreadyAdded", { name: playlistName }));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("more", { name })}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => useLibraryStore.getState().toggleFavoriteSurah(track.surah)}>
            <HeartIcon className={isFavorite ? "fill-current text-primary" : undefined} />
            {isFavorite ? t("unfavoriteSurah") : t("favoriteSurah")}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListPlusIcon />
              {t("addToPlaylist")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {playlists.map((p) => (
                <DropdownMenuItem key={p.id} onSelect={() => addTo(p.id, p.name)}>
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
              {playlists.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={() => setPlaylistOpen(true)}>
                <PlusIcon />
                {t("newPlaylist")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {downloaded ? (
            <DropdownMenuItem
              onSelect={() =>
                useDownloadsStore
                  .getState()
                  .remove(track)
                  .then(() => toast(td("removed")))
              }
            >
              <Trash2Icon />
              {t("removeDownload")}
            </DropdownMenuItem>
          ) : canDownload ? (
            <DropdownMenuItem disabled={downloading} onSelect={() => setDownloadOpen(true)}>
              <DownloadIcon />
              {t("download")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <DownloadIcon />
              {t("streamOnly")}
            </DropdownMenuItem>
          )}
          {context !== "other" && <DropdownMenuSeparator />}
          {context !== "reciter" && (
            <DropdownMenuItem asChild>
              <Link href={`/reciters/${track.reciterId}`}>
                <MicVocalIcon />
                {t("goToReciter")}
              </Link>
            </DropdownMenuItem>
          )}
          {context !== "surah" && (
            <DropdownMenuItem asChild>
              <Link href={`/surahs/${track.surah}`}>
                <BookOpenIcon />
                {t("goToSurah")}
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PlaylistDialog
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        mode="create"
        onSubmit={(playlistName) => {
          useLibraryStore.getState().createPlaylist(playlistName, [track]);
          setPlaylistOpen(false);
          toast.success(tp("added", { name: playlistName }));
        }}
      />
      <DownloadDialog track={track} open={downloadOpen} onOpenChange={setDownloadOpen} />
    </>
  );
}

export function DownloadedBadge({ track }: { track: Track }) {
  const t = useTranslations("downloads");
  const downloaded = useDownloadsStore((s) => Boolean(s.records[trackKey(track)]));
  const progress = useDownloadsStore((s) => s.progress[trackKey(track)]);
  if (progress !== undefined) {
    return <span className="text-xs text-muted-foreground tabular-nums">{t("downloading", { percent: Math.round(progress * 100) })}</span>;
  }
  if (!downloaded) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-primary">
      <CheckIcon className="size-3.5" />
      <span className="sr-only sm:not-sr-only">{t("offlineBadge")}</span>
    </span>
  );
}
