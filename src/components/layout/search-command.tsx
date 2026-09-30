"use client";

import { BookOpenIcon, MicVocalIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { getLocalizedReciterName, getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { matchesName, matchesSurah } from "@/lib/search";
import { SURAHS } from "@/lib/surahs";
import type { ReciterSummary } from "@/lib/types";

const RESULT_LIMIT = 8;

export function SearchCommand({ variant }: { variant: "wide" | "icon" }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [reciters, setReciters] = useState<ReciterSummary[] | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || reciters) return;
    fetch("/api/reciters")
      .then((res) => (res.ok ? res.json() : []))
      .then(setReciters)
      .catch(() => setReciters([]));
  }, [open, reciters]);

  const surahResults = SURAHS.filter((s) => matchesSurah(s, query)).slice(0, RESULT_LIMIT);
  const reciterResults = (reciters ?? []).filter((r) => matchesName(r.name, query)).slice(0, RESULT_LIMIT);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const locale = useLocale();

  return (
    <>
      {variant === "wide" ? (
        <Button variant="outline" className="h-9 w-full justify-start gap-2 text-muted-foreground" onClick={() => setOpen(true)}>
          <SearchIcon />
          <span className="flex-1 text-left">{t("open")}</span>
          <Kbd>⌘K</Kbd>
        </Button>
      ) : (
        <Button variant="ghost" size="icon-lg" aria-label={t("open")} onClick={() => setOpen(true)}>
          <SearchIcon />
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} title={t("open")} description={t("placeholder")}>
        <Command shouldFilter={false}>
        <CommandInput placeholder={t("placeholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{reciters ? t("empty", { query }) : t("loading")}</CommandEmpty>
          {surahResults.length > 0 && (
            <CommandGroup heading={t("surahs")}>
              {surahResults.map((s) => (
                <CommandItem key={s.id} value={`surah-${s.id}`} onSelect={() => go(`/surahs/${s.id}`)}>
                  <BookOpenIcon />
                  <span className="w-6 text-muted-foreground tabular-nums">
                    {locale === "bn" ? toBengaliDigits(s.id) : s.id}
                  </span>
                  <span className="flex-1">{getLocalizedSurahName(s, locale)}</span>
                  <span className="font-arabic text-base" lang="ar" dir="rtl">
                    {s.arabicName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {reciterResults.length > 0 && (
            <CommandGroup heading={t("reciters")}>
              {reciterResults.map((r) => (
                <CommandItem key={r.id} value={`reciter-${r.id}`} onSelect={() => go(`/reciters/${r.id}`)}>
                  <MicVocalIcon />
                  {getLocalizedReciterName(r.name, locale)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
