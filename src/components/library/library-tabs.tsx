"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrated } from "@/stores/hydration";
import { BookmarksPanel } from "./bookmarks-panel";
import { DownloadsPanel } from "./downloads-panel";
import { FavoritesPanel } from "./favorites-panel";
import { HistoryPanel } from "./history-panel";
import { PlaylistsPanel } from "./playlists-panel";
import { LIBRARY_TABS, type LibraryTab } from "./tabs";

const PANELS: Record<LibraryTab, () => React.ReactNode> = {
  favorites: FavoritesPanel,
  playlists: PlaylistsPanel,
  bookmarks: BookmarksPanel,
  history: HistoryPanel,
  downloads: DownloadsPanel,
};

export function LibraryTabs({ initialTab }: { initialTab: LibraryTab }) {
  const t = useTranslations("library.tabs");
  const hydrated = useHydrated();

  return (
    <Tabs defaultValue={initialTab} className="gap-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          {LIBRARY_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="sm:px-4">
              {t(tab)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
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
