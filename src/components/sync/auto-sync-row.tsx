"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSyncStore } from "@/stores/sync-store";

export function AutoSyncRow() {
  const t = useTranslations("sync.auto");
  const id = useId();
  const auto = useSyncStore((state) => state.auto);
  const synced = useSyncStore((state) => state.lastSyncedAt !== null);

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id}>{t("title")}</Label>
        <p id={`${id}-hint`} className="max-w-prose text-sm text-muted-foreground">
          {synced ? t("description") : t("needsFirst")}
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-hint`} checked={auto} disabled={!synced} onCheckedChange={(on) => useSyncStore.getState().setAuto(on)} />
    </div>
  );
}
