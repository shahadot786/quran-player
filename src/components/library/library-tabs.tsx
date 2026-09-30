"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrated } from "@/stores/hydration";
import { DownloadsPanel } from "./downloads-panel";
import { FavoritesPanel } from "./favorites-panel";
import { HistoryPanel } from "./history-panel";
import { PlaylistsPanel } from "./playlists-panel";
import { LIBRARY_TABS, type LibraryTab } from "./tabs";

const PANELS: Record<LibraryTab, () => React.ReactNode> = {
  favorites: FavoritesPanel,
  playlists: PlaylistsPanel,
  history: HistoryPanel,
  downloads: DownloadsPanel,
};

export function LibraryTabs({ initialTab }: { initialTab: LibraryTab }) {
  const t = useTranslations("library.tabs");
  const hydrated = useHydrated();

  return (
    <Tabs defaultValue={initialTab} className="gap-6">
      <TabsList className="w-full sm:w-fit">
        {LIBRARY_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="sm:px-4">
            {t(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
      {LIBRARY_TABS.map((tab) => {
        const Panel = PANELS[tab];
        return (
          <TabsContent key={tab} value={tab}>
            {hydrated ? <Panel /> : <PanelSkeleton />}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function PanelSkeleton() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}
