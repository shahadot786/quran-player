"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { getLocalizedReciterName, getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NowPlayingInfo({
  track,
  linked = true,
  size = "sm",
  className,
}: {
  track: Track;
  linked?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const locale = useLocale();
  const surah = getSurah(track.surah);
  const titleClass = cn("block truncate font-semibold", size === "lg" ? "text-lg" : "text-sm");
  const subtitleClass = cn("block truncate text-muted-foreground", size === "lg" ? "text-base" : "text-xs");

  const surahNum = locale === "bn" ? toBengaliDigits(track.surah) : track.surah;
  const surahName = getLocalizedSurahName(surah, locale);
  const reciterName = getLocalizedReciterName(track.reciterName, locale);
  const title = surah ? `${surahNum}. ${surahName}` : String(surahNum);

  return (
    <div className={cn("min-w-0", className)}>
      {linked ? (
        <Link href={`/surahs/${track.surah}`} className={cn(titleClass, "hover:underline")}>
          {title}
        </Link>
      ) : (
        <p className={titleClass}>{title}</p>
      )}
      {linked ? (
        <Link href={`/reciters/${track.reciterId}`} className={cn(subtitleClass, "hover:text-foreground")}>
          {reciterName}
        </Link>
      ) : (
        <p className={subtitleClass}>{reciterName}</p>
      )}
    </div>
  );
}
