"use client";

import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
import { matchesName } from "@/lib/search";
import type { ReciterSummary } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { ReciterCard } from "./reciter-card";
import { SearchInput } from "./search-input";

export function ReciterGrid({ reciters }: { reciters: ReciterSummary[] }) {
  const t = useTranslations("reciters");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const results = reciters.filter((r) => matchesName(r.name, deferred));

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
        label={t("searchLabel")}
        clearLabel={t("clearSearch")}
        className="max-w-md"
      />
      {results.length === 0 ? (
        <EmptyState>{t("empty", { query })}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((reciter) => (
            <li key={reciter.id}>
              <ReciterCard reciter={reciter} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
