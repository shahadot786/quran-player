"use client";

import { ArrowDownIcon, ArrowUpIcon, EllipsisIcon, PencilIcon, PlayIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PlaylistDialog } from "@/components/playlist-dialog";
import { SurahRow } from "@/components/surah-row";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trackKey } from "@/lib/audio-url";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import { useLibraryStore, type Playlist } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";

type Dialog = { kind: "create" } | { kind: "rename"; playlist: Playlist } | { kind: "delete"; playlist: Playlist } | null;

export function PlaylistsPanel() {
  const t = useTranslations("playlists");
  const playlists = useLibraryStore((s) => s.playlists);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ kind: "create" })}>
          <PlusIcon />
          {t("create")}
        </Button>
      </div>

      {playlists.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <PlaylistCard
                playlist={playlist}
                onRename={() => setDialog({ kind: "rename", playlist })}
                onDelete={() => setDialog({ kind: "delete", playlist })}
              />
            </li>
          ))}
        </ul>
      )}

      <PlaylistDialog
        open={dialog?.kind === "create" || dialog?.kind === "rename"}
        onOpenChange={(open) => !open && close()}
        mode={dialog?.kind === "rename" ? "rename" : "create"}
        initialName={dialog?.kind === "rename" ? dialog.playlist.name : ""}
        onSubmit={(name) => {
          if (dialog?.kind === "rename") useLibraryStore.getState().renamePlaylist(dialog.playlist.id, name);
          else {
            useLibraryStore.getState().createPlaylist(name);
            toast.success(t("created"));
          }
          close();
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
        title={t("deleteTitle", { name: dialog?.kind === "delete" ? dialog.playlist.name : "" })}
        description={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          if (dialog?.kind !== "delete") return;
          useLibraryStore.getState().deletePlaylist(dialog.playlist.id);
          toast(t("deleted"));
        }}
      />
    </section>
  );
}

function PlaylistCard({ playlist, onRename, onDelete }: { playlist: Playlist; onRename: () => void; onDelete: () => void }) {
  const t = useTranslations("playlists");
  const locale = useLocale();
  const { tracks } = playlist;
  const move = useLibraryStore((s) => s.movePlaylistTrack);
  const remove = useLibraryStore((s) => s.removeFromPlaylist);

  return (
    <article aria-label={playlist.name} className="rounded-2xl border bg-card p-3 sm:p-4">
      <header className="flex items-center gap-3 px-2 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{playlist.name}</h2>
          <p className="text-sm text-muted-foreground">{t("tracks", { count: tracks.length })}</p>
        </div>
        <Button disabled={tracks.length === 0} onClick={() => usePlayerStore.getState().playQueue(tracks, 0)}>
          <PlayIcon fill="currentColor" />
          <span className="sr-only sm:not-sr-only">{t("playAll")}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("options", { name: playlist.name })}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRename}>
              <PencilIcon />
              {t("rename")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {tracks.length === 0 ? (
        <EmptyState className="mt-2">{t("emptyPlaylist")}</EmptyState>
      ) : (
        <ul className="flex flex-col">
          {tracks.map((track, index) => {
            const name = getSurah(track.surah)?.name ?? String(track.surah);
            const reciterName = getLocalizedReciterName(track.reciterName, locale);
            return (
              <li key={trackKey(track)} className="flex items-center gap-1">
                <div className="min-w-0 flex-1">
                  <SurahRow track={track} queue={tracks} context="other" subtitle={reciterName} />
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    aria-label={t("moveUp", { name })}
                    onClick={() => move(playlist.id, index, index - 1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === tracks.length - 1}
                    aria-label={t("moveDown", { name })}
                    onClick={() => move(playlist.id, index, index + 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={t("remove", { name })} onClick={() => remove(playlist.id, index)}>
                    <XIcon />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
