"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, Minus, Plus, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { BISMILLAH_ARABIC, getSurahText, type SurahText } from "@/lib/quran-text";
import { getSurah } from "@/lib/surahs";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

const FONT_SIZES = [
  { label: "sm", arabicClass: "text-lg sm:text-xl", lineClass: "leading-loose" },
  { label: "md", arabicClass: "text-xl sm:text-2xl", lineClass: "leading-loose" },
  { label: "lg", arabicClass: "text-2xl sm:text-3xl", lineClass: "leading-loose" },
  { label: "xl", arabicClass: "text-3xl sm:text-4xl", lineClass: "leading-loose" },
] as const;

export function LiveQuranPanel({ surahId: propSurahId }: { surahId?: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const switchId = useId();
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const activeSurahId = propSurahId ?? currentTrack?.surah ?? 1;

  const [loadedSurahId, setLoadedSurahId] = useState<number | null>(null);
  const [data, setData] = useState<SurahText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const [showBengali, setShowBengali] = useState(true);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);

  const loading = loadedSurahId !== activeSurahId && !error;

  useEffect(() => {
    let cancelled = false;

    getSurahText(activeSurahId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoadedSurahId(activeSurahId);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load verses");
          setLoadedSurahId(activeSurahId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSurahId]);

  const surahMeta = getSurah(activeSurahId);
  const localizedSurahName = surahMeta ? getLocalizedSurahName(surahMeta, locale) : data?.name;
  const currentFontSize = FONT_SIZES[fontSizeIndex];

  const handleCopyAyah = async (ayahNumber: number, arabic: string, bengali: string) => {
    const textToCopy = `${arabic}\n\n${bengali}\n\n[${surahMeta?.name ?? `Surah ${activeSurahId}`}: ${ayahNumber}]`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAyah(ayahNumber);
      toast.success(t("playerPage.liveQuran.copied"));
      setTimeout(() => setCopiedAyah(null), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleDecreaseFont = () => {
    setFontSizeIndex((prev) => Math.max(0, prev - 1));
  };

  const handleIncreaseFont = () => {
    setFontSizeIndex((prev) => Math.min(FONT_SIZES.length - 1, prev + 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with surah info & controls */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-base sm:text-lg">
                {localizedSurahName}
              </span>
              <span className="font-arabic text-primary text-xl leading-none" dir="rtl">
                {data?.arabicName || surahMeta?.arabicName}
              </span>
            </div>
            {surahMeta && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {t("playerPage.surahOf", {
                    number: locale === "bn" ? toBengaliDigits(surahMeta.id) : surahMeta.id,
                  })}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t(`surahs.${surahMeta.revelation}`)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t("surahs.verses", { count: surahMeta.versesCount })}
                </Badge>
              </div>
            )}
          </div>

          {/* Font size buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleDecreaseFont}
              disabled={fontSizeIndex === 0}
              aria-label={t("playerPage.liveQuran.decreaseFont")}
              title={t("playerPage.liveQuran.decreaseFont")}
            >
              <Minus className="size-3" />
            </Button>
            <span className="text-xs text-muted-foreground w-6 text-center select-none font-mono">
              A
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleIncreaseFont}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
              aria-label={t("playerPage.liveQuran.increaseFont")}
              title={t("playerPage.liveQuran.increaseFont")}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        {/* Translation toggle */}
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
          <label htmlFor={switchId} className="cursor-pointer text-muted-foreground select-none">
            {t("playerPage.liveQuran.showBengali")}
          </label>
          <Switch
            id={switchId}
            checked={showBengali}
            onCheckedChange={setShowBengali}
            aria-label={t("playerPage.liveQuran.showBengali")}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border p-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-5 w-4/5 rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-destructive">{t("playerPage.liveQuran.error")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadedSurahId(null);
              setError(null);
              getSurahText(activeSurahId)
                .then((res) => {
                  setData(res);
                  setLoadedSurahId(activeSurahId);
                })
                .catch(() => {
                  setError("Failed to load verses");
                  setLoadedSurahId(activeSurahId);
                });
            }}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" />
            {t("playerPage.liveQuran.retry")}
          </Button>
        </div>
      )}

      {/* Verses content */}
      {!loading && !error && data && (
        <div className="flex flex-col gap-3">
          {/* Bismillah Banner (Surahs other than 1 and 9) */}
          {data.bismillahPre && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 border border-primary/15 py-4 px-3 text-center">
              <p
                className="font-arabic text-2xl sm:text-3xl text-primary leading-relaxed"
                dir="rtl"
                lang="ar"
              >
                {BISMILLAH_ARABIC}
              </p>
              {showBengali && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  {t("playerPage.liveQuran.bismillah")}
                </p>
              )}
            </div>
          )}

          {/* Ayahs list */}
          <ul className="flex flex-col gap-3">
            {data.ayahs.map((ayah) => {
              const ayahNumFormatted =
                locale === "bn" ? toBengaliDigits(ayah.numberInSurah) : ayah.numberInSurah;
              const isCopied = copiedAyah === ayah.numberInSurah;

              return (
                <li
                  key={ayah.numberInSurah}
                  className="group relative flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"
                >
                  {/* Ayah Header with number badge and copy button */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {t("playerPage.liveQuran.ayah", { number: ayahNumFormatted })}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyAyah(ayah.numberInSurah, ayah.arabic, ayah.bengali)}
                      className="opacity-60 group-hover:opacity-100 transition-opacity"
                      aria-label={t("playerPage.liveQuran.copyAyah")}
                      title={t("playerPage.liveQuran.copyAyah")}
                    >
                      {isCopied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                    </Button>
                  </div>

                  {/* Arabic Ayah Text */}
                  <div
                    className={`font-arabic text-foreground text-right ${currentFontSize.arabicClass} ${currentFontSize.lineClass}`}
                    dir="rtl"
                    lang="ar"
                  >
                    {ayah.arabic}
                  </div>

                  {/* Bengali Translation */}
                  {showBengali && ayah.bengali && (
                    <div className="border-t border-border/40 pt-2 text-left">
                      <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                        {ayah.bengali}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
