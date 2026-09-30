"use client";

import { CheckIcon, ChevronsUpDownIcon, RadioIcon } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ReciterAvatar } from "@/components/reciter-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getLocalizedMoshafName, getLocalizedReciterName } from "@/lib/bengali-data";
import { matchesName } from "@/lib/search";
import type { Reciter } from "@/lib/types";

export function ReciterPicker({ reciters, selectedId, onSelect }: { reciters: Reciter[]; selectedId?: number; onSelect: (id: number) => void }) {
  const t = useTranslations("playerPage");
  const tr = useTranslations("reciters");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = reciters.find((r) => r.id === selectedId);
  const [syncedOnly, setSyncedOnly] = useState(false);
  const results = reciters.filter((r) => matchesName(r.name, query) && (!syncedOnly || r.moshafs.some((m) => m.synced)));

  return (
    <>
      <Button variant="outline" className="h-auto w-full justify-between gap-3 py-2" onClick={() => setOpen(true)} aria-label={t("changeReciter")}>
        <span className="flex min-w-0 items-center gap-3">
          {selected && <ReciterAvatar name={selected.name} className="size-9 text-xs" />}
          <span className="min-w-0 text-left">
            <span className="block text-xs font-normal text-muted-foreground">{t("reciter")}</span>
            <span className="block truncate">{selected ? getLocalizedReciterName(selected.name, locale) : t("chooseReciter")}</span>
          </span>
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={t("chooseReciter")} description={t("chooseReciterDescription")}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={t("searchReciters")} value={query} onValueChange={setQuery} />
          <label className="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm text-muted-foreground">
            {t("syncedOnly")}
            <Switch checked={syncedOnly} onCheckedChange={setSyncedOnly} />
          </label>
          <CommandList>
            <CommandEmpty>{t("noReciters", { query })}</CommandEmpty>
            {results.map((r) => (
              <CommandItem
                key={r.id}
                value={String(r.id)}
                onSelect={() => {
                  onSelect(r.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <ReciterAvatar name={r.name} className="size-8 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{getLocalizedReciterName(r.name, locale)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.moshafs.length > 1 ? tr("recitations", { count: r.moshafs.length }) : getLocalizedMoshafName(r.moshafs[0]!.name, locale)}
                  </span>
                </span>
                {r.moshafs.some((m) => m.synced) && (
                  <Badge variant="secondary" className="gap-1">
                    <RadioIcon className="size-3" />
                    {t("synced")}
                  </Badge>
                )}
                {r.id === selectedId && <CheckIcon className="text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
