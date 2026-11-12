"use client";

import { useTranslations } from "next-intl";
import type { WidgetReciter } from "@/lib/embed/reciters";
import { ReciterPicker } from "./reciter-picker";

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

  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
        <span aria-hidden className="grid size-6 place-items-center rounded-full bg-primary font-arabic text-sm leading-none text-primary-foreground">
          ت
        </span>
        <span className="text-sm font-semibold">{app("name")}</span>
      </div>
      {reciters.length > 1 && <ReciterPicker variant="pill" reciters={reciters} value={reciterId} onSelect={onChange} prefix={t("changeReciter")} />}
    </header>
  );
}
