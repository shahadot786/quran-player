"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProgressModel } from "@/hooks/use-progress-model";
import { useHydrated } from "@/stores/hydration";
import { KhatmHistory } from "./khatm-history";
import { Overview } from "./overview";
import { ParaGrid } from "./para-grid";
import { SurahGrid } from "./surah-grid";
import { SurahSheet } from "./surah-sheet";

export function ProgressView() {
  const t = useTranslations("progress");
  const common = useTranslations("common");
  const hydrated = useHydrated();
  const model = useProgressModel();
  const [selected, setSelected] = useState<number | null>(null);

  if (!hydrated) {
    return (
      <div role="status" aria-label={common("loading")} className="flex flex-col gap-4">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {model.overall.surahsStarted === 0 && (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/player">{t("openPlayer")}</Link>
            </Button>
          }
        >
          {t("empty")}
        </EmptyState>
      )}

      <Overview model={model} />

      <Tabs defaultValue="paras" className="gap-5">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="paras">{t("tabs.paras")}</TabsTrigger>
            <TabsTrigger value="surahs">{t("tabs.surahs")}</TabsTrigger>
            <TabsTrigger value="khatm">{t("tabs.khatm")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="paras">
          <ParaGrid paras={model.paras} />
        </TabsContent>
        <TabsContent value="surahs">
          <SurahGrid cells={model.surahs} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="khatm">
          <KhatmHistory />
        </TabsContent>
      </Tabs>

      <SurahSheet cell={selected === null ? null : (model.surahs[selected - 1] ?? null)} onClose={() => setSelected(null)} />
    </div>
  );
}
