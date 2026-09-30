"use client";

import { ListMusicIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { QueueList } from "./queue-list";

export function QueueSheet() {
  const t = useTranslations("player.queue");
  const locale = useLocale();
  const count = usePlayerStore((s) => s.queue.length);
  const current = usePlayerStore(selectCurrentTrack);
  const reciterName = current ? getLocalizedReciterName(current.reciterName, locale) : "";

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("open")} disabled={!current}>
              <ListMusicIcon />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("open")}</TooltipContent>
      </Tooltip>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{current ? t("description", { count, reciter: reciterName }) : t("empty")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <QueueList className="p-2" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
