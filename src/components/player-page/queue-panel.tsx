"use client";

import { ListPlusIcon, ListXIcon, ShuffleIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { QueueList } from "@/components/player/queue-list";
import { PlaylistDialog } from "@/components/playlist-dialog";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";

export function QueuePanel() {
  const t = useTranslations("playerPage");
  const tp = useTranslations("playlists");
  const count = usePlayerStore((s) => s.queue.length);
  const [saveOpen, setSaveOpen] = useState(false);
  const { shuffleQueue, clearQueue } = usePlayerStore.getState();

  return (
    <div className="flex flex-col gap-3">
      {count > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{t("queueCount", { count })}</p>
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" disabled={count < 3} onClick={shuffleQueue}>
              <ShuffleIcon />
              {t("shuffle")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSaveOpen(true)}>
              <ListPlusIcon />
              {t("saveAsPlaylist")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={count < 2}
              onClick={() => {
                clearQueue();
                toast(t("cleared"));
              }}
            >
              <ListXIcon />
              {t("clear")}
            </Button>
          </div>
        </div>
      )}
      <QueueList manage />
      <PlaylistDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        mode="create"
        onSubmit={(name) => {
          useLibraryStore.getState().createPlaylist(name, usePlayerStore.getState().queue);
          setSaveOpen(false);
          toast.success(tp("created"));
        }}
      />
    </div>
  );
}
