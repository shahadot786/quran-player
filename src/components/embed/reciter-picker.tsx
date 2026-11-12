"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { matchesName } from "@/lib/search";
import { SearchPicker } from "./search-picker";

export function ReciterPicker({
  reciters,
  value,
  onSelect,
  variant,
  prefix,
  id,
}: {
  reciters: { id: number; name: string }[];
  value: number | null;
  onSelect: (reciter: number) => void;
  variant?: "field" | "pill";
  prefix: string;
  id?: string;
}) {
  const s = useTranslations("surahs");
  const locale = useLocale();

  const items = useMemo(() => reciters.map((reciter) => ({ id: reciter.id, label: getLocalizedReciterName(reciter.name, locale) })), [reciters, locale]);
  const names = useMemo(() => new Map(reciters.map((reciter) => [reciter.id, reciter.name])), [reciters]);
  const matches = useCallback((reciter: number, query: string) => matchesName(names.get(reciter) ?? "", query), [names]);

  return (
    <SearchPicker
      id={id}
      variant={variant}
      items={items}
      value={value}
      onSelect={onSelect}
      matches={matches}
      labels={{
        empty: s("chooseReciter"),
        prefix,
        search: s("filterReciters"),
        placeholder: s("filterReciters"),
        list: s("chooseReciter"),
        noResults: (query) => s("noReciters", { query }),
      }}
    />
  );
}
