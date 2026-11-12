"use client";

import { ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import type { WidgetReciter } from "@/lib/embed/reciters";

export function EmbedHeader({
  reciters,
  reciterId,
  onChange,
}: {
  reciters: WidgetReciter[];
  reciterId: number;
  onChange: (id: number) => void;
}) {
  const t = useTranslations("embed");
  const app = useTranslations("app");
  const locale = useLocale();
  const current = reciters.find((r) => r.id === reciterId);

  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
        <span aria-hidden className="grid size-6 place-items-center rounded-full bg-primary font-arabic text-sm leading-none text-primary-foreground">
          ت
        </span>
        <span className="text-sm font-semibold">{app("name")}</span>
      </div>
      {current && reciters.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label={t("changeReciter")} className="h-9 min-w-0 rounded-full bg-card px-3 shadow-sm">
              <span className="truncate">{getLocalizedReciterName(current.name, locale)}</span>
              <ChevronDownIcon aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-72">
            <DropdownMenuRadioGroup value={String(reciterId)} onValueChange={(value) => onChange(Number(value))}>
              {reciters.map((reciter) => (
                <DropdownMenuRadioItem key={reciter.id} value={String(reciter.id)}>
                  {getLocalizedReciterName(reciter.name, locale)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
