"use client";

import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDuration } from "@/hooks/use-duration";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { getLocalizedReciterName, getLocalizedSurahName } from "@/lib/bengali-data";
import { parasOfSurah } from "@/lib/progress/juz";
import { sliceLookup } from "@/lib/progress/lookup";
import { mostUsedReciter, type SurahCell } from "@/lib/progress/model";
import { formatPercent } from "@/lib/progress/percent";
import { getSurah, SURAHS } from "@/lib/surahs";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { useProgressStore } from "@/stores/progress-store";
import { HeatStrip } from "./heat-strip";

const STATE_KEYS = { "not-started": "notStarted", "in-progress": "inProgress", finished: "finished" } as const;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export function SurahSheet({ cell, onClose }: { cell: SurahCell | null; onClose: () => void }) {
  const t = useTranslations("progress");
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const n = useLocalizedNumber();
  const duration = useDuration();
  const slices = useProgressStore((s) => s.slices);
  const lifetime = useProgressStore((s) => (cell ? s.lifetime[cell.id] : undefined));
  const current = usePlayerStore(selectCurrentTrack);
  const surah = cell ? getSurah(cell.id) : undefined;
  const reciter = lifetime ? mostUsedReciter(lifetime.reciters) : null;

  return (
    <Sheet open={cell !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {cell && surah && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-2">
                <SheetTitle>{getLocalizedSurahName(surah, locale)}</SheetTitle>
                <Badge variant={cell.state === "finished" ? "default" : "outline"}>{t(`states.${STATE_KEYS[cell.state]}`)}</Badge>
              </div>
              <SheetDescription className="flex items-center justify-between gap-3">
                <span>{t("detail.paras", { paras: parasOfSurah(cell.id).map(n).join(", ") })}</span>
                <span className="font-arabic text-2xl leading-none text-foreground" lang="ar" dir="rtl">
                  {surah.arabicName}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 p-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">{t("detail.strip")}</h3>
                <HeatStrip slices={sliceLookup(slices)(cell.id)} label={`${t("detail.strip")}: ${n(formatPercent(cell.coverage))}%`} />
                <p className="text-xs text-muted-foreground">{t("detail.stripDescription")}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                <Fact label={t("detail.heard")}>{n(formatPercent(cell.coverage))}%</Fact>
                <Fact label={t("detail.completions")}>{n(lifetime?.completions ?? 0)}</Fact>
                <Fact label={t("detail.lastListened")}>
                  {lifetime?.lastAt ? format.relativeTime(lifetime.lastAt, now) : t("detail.never")}
                </Fact>
                <Fact label={t("detail.timeSpent")}>{lifetime && lifetime.seconds > 0 ? duration(lifetime.seconds) : lifetime ? t("detail.notTracked") : "–"}</Fact>
                <Fact label={t("detail.reciter")}>{reciter ? getLocalizedReciterName(reciter.name, locale) : "–"}</Fact>
              </dl>

              {lifetime?.source && lifetime.source !== "history" && <p className="text-xs text-muted-foreground">{t("detail.earlier")}</p>}

              <div className="flex flex-col gap-2">
                {current && (
                  <Button
                    onClick={() => {
                      usePlayerStore.getState().playQueue(SURAHS.map((s) => ({ ...current, surah: s.id })), cell.id - 1);
                      onClose();
                    }}
                  >
                    <PlayIcon fill="currentColor" />
                    {t("detail.play", { reciter: getLocalizedReciterName(current.reciterName, locale) })}
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/surahs/${cell.id}`}>{t("detail.choose")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
