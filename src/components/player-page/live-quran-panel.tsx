"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Minus, Play, Plus, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAyahSync } from "@/hooks/use-ayah-sync";
import { getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { BISMILLAH_ARABIC, getSurahText, type SurahText } from "@/lib/quran-text";
import { getSurah } from "@/lib/surahs";
import { cn } from "@/lib/utils";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

const FONT_SIZES = [
  { label: "sm", arabicClass: "text-lg sm:text-xl", lineClass: "leading-loose" },
  { label: "md", arabicClass: "text-xl sm:text-2xl", lineClass: "leading-loose" },
  { label: "lg", arabicClass: "text-2xl sm:text-3xl", lineClass: "leading-loose" },
  { label: "xl", arabicClass: "text-3xl sm:text-4xl", lineClass: "leading-loose" },
] as const;

const USER_SCROLL_PAUSE_MS = 6000;

function SyncStatus({ status }: { status: "unavailable" | "loading" | "ready" }) {
  const t = useTranslations("playerPage.liveQuran");
  if (status === "ready") {
    return (
      <p className="flex items-center gap-2 text-xs font-medium text-primary" role="status">
        <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
        {t("syncOn")}
      </p>
    );
  }
  if (status === "loading") return <p className="text-xs text-muted-foreground" role="status">{t("syncLoading")}</p>;
  return <p className="text-xs text-muted-foreground" role="status">{t("syncNone")}</p>;
}

// Scrolls the nearest scrollable ancestor rather than the whole page, so following along never yanks the layout.
function centerInView(element: HTMLElement, behavior: ScrollBehavior) {
  let parent = element.parentElement;
  while (parent && parent.scrollHeight <= parent.clientHeight + 1) parent = parent.parentElement;
  const container = parent && parent !== document.body ? parent : document.scrollingElement;
  if (!container) return;
  const box = container === document.scrollingElement ? { top: 0, height: window.innerHeight } : container.getBoundingClientRect();
  const offset = element.getBoundingClientRect().top - box.top - (box.height - element.offsetHeight) / 2;
  container.scrollBy({ top: offset, behavior });
}

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
  const [follow, setFollow] = useState(true);
  const followId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const bismillahRef = useRef<HTMLDivElement>(null);
  const userScrolledAt = useRef(0);
  const previousActive = useRef<number | null>(null);

  const playing = currentTrack && currentTrack.surah === activeSurahId ? currentTrack : undefined;
  const sync = useAyahSync(playing);
  const active = sync.active;

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

  useEffect(() => {
    if (!follow || active === null) return;
    const jumped = previousActive.current !== null && Math.abs(active - previousActive.current) > 1;
    previousActive.current = active;
    if (!jumped && Date.now() - userScrolledAt.current < USER_SCROLL_PAUSE_MS) return;
    const element = active === 0 ? bismillahRef.current : listRef.current?.querySelector<HTMLElement>(`[data-ayah="${active}"]`);
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    centerInView(element, reduced ? "auto" : "smooth");
  }, [active, follow, data]);

  useEffect(() => {
    const markScrolled = () => {
      userScrolledAt.current = Date.now();
    };
    const events = ["wheel", "touchmove"] as const;
    events.forEach((name) => window.addEventListener(name, markScrolled, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, markScrolled));
  }, []);

  const playFrom = (seconds: number) => {
    const player = usePlayerStore.getState();
    player.seek(seconds);
    userScrolledAt.current = 0;
    if (!player.isPlaying) player.play();
  };

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

        <SyncStatus status={sync.status} />

        {sync.status === "ready" && (
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
            <label htmlFor={followId} className="cursor-pointer text-muted-foreground select-none">
              {t("playerPage.liveQuran.follow")}
            </label>
            <Switch id={followId} checked={follow} onCheckedChange={setFollow} aria-label={t("playerPage.liveQuran.follow")} />
          </div>
        )}

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
            <div
              ref={bismillahRef}
              data-active={active === 0 || undefined}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-primary/15 bg-primary/5 px-3 py-4 text-center transition-colors",
                active === 0 && "border-primary bg-primary/15 ring-2 ring-primary/40",
              )}
            >
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
          <ul ref={listRef} className="flex flex-col gap-3">
            {data.ayahs.map((ayah) => {
              const ayahNumFormatted =
                locale === "bn" ? toBengaliDigits(ayah.numberInSurah) : ayah.numberInSurah;
              const isCopied = copiedAyah === ayah.numberInSurah;
              const isActive = active === ayah.numberInSurah;
              const timing = sync.timings?.ayahs.find((entry) => entry.ayah === ayah.numberInSurah);

              return (
                <li
                  key={ayah.numberInSurah}
                  data-ayah={ayah.numberInSurah}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/20",
                    isActive && "border-primary bg-primary/10 ring-2 ring-primary/40 hover:bg-primary/10",
                  )}
                >
                  {/* Ayah Header with number badge and copy button */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {t("playerPage.liveQuran.ayah", { number: ayahNumFormatted })}
                    </span>

                    <div className="flex items-center gap-1">
                    {timing && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => playFrom(timing.start)}
                        aria-label={t("playerPage.liveQuran.playFromAyah", { number: ayahNumFormatted })}
                        title={t("playerPage.liveQuran.playFromAyah", { number: ayahNumFormatted })}
                      >
                        <Play className="size-3" fill="currentColor" />
                      </Button>
                    )}
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
