"use client";

import { useState } from "react";
import { BookOpen, ListMusic, ListOrdered, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Reciter } from "@/lib/types";
import { useHydrated } from "@/stores/hydration";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { LiveQuranPanel } from "./live-quran-panel";
import { NowPlayingPanel } from "./now-playing-panel";
import { QueuePanel } from "./queue-panel";
import { SurahPicker } from "./surah-picker";
import { usePlayerSource } from "./use-player-source";

export function PlayerView({ reciters, defaultReciterId }: { reciters: Reciter[]; defaultReciterId: number }) {
  const t = useTranslations();
  const hydrated = useHydrated();
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const { source, choose } = usePlayerSource(reciters, defaultReciterId);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tab, setTab] = useState<string>(currentTrack ? "live" : "surahs");

  if (!hydrated) {
    return (
      <div role="status" aria-label={t("common.loading")} className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  const handleOpenLiveQuran = () => {
    setIsCollapsed(false);
    setTab("live");
  };

  if (isCollapsed) {
    return (
      <div className="relative flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="gap-2 shadow-sm"
            aria-label={t("playerPage.sidebar.expand")}
          >
            <PanelRightOpen className="size-4 text-primary" />
            <span>{t("playerPage.sidebar.expand")}</span>
          </Button>
        </div>
        <div className="w-full">
          <NowPlayingPanel
            reciters={reciters}
            source={source}
            onChoose={choose}
            onViewLiveQuran={handleOpenLiveQuran}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid gap-6 lg:grid-cols-5 lg:items-start">
      <div className="lg:col-span-3">
        <NowPlayingPanel
          reciters={reciters}
          source={source}
          onChoose={choose}
          onViewLiveQuran={handleOpenLiveQuran}
        />
      </div>
      <div className="flex flex-col rounded-2xl border bg-card p-3 sm:p-4 shadow-sm lg:col-span-2">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live" className="gap-1.5 text-xs sm:text-sm">
                <BookOpen className="size-3.5" />
                <span>{t("playerPage.tabs.live")}</span>
              </TabsTrigger>
              <TabsTrigger value="surahs" className="gap-1.5 text-xs sm:text-sm">
                <ListMusic className="size-3.5" />
                <span>{t("playerPage.tabs.surahs")}</span>
              </TabsTrigger>
              <TabsTrigger value="queue" className="gap-1.5 text-xs sm:text-sm">
                <ListOrdered className="size-3.5" />
                <span>{t("playerPage.tabs.queue")}</span>
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCollapsed(true)}
              aria-label={t("playerPage.sidebar.collapse")}
              title={t("playerPage.sidebar.collapse")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
          <TabsContent value="live" className="mt-3 lg:max-h-160 lg:overflow-y-auto">
            <LiveQuranPanel />
          </TabsContent>
          <TabsContent value="surahs" className="mt-3 lg:max-h-160 lg:overflow-y-auto">
            {source && <SurahPicker source={source} />}
          </TabsContent>
          <TabsContent value="queue" className="mt-3 lg:max-h-160 lg:overflow-y-auto">
            <QueuePanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
