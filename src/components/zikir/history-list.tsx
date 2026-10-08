"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useZikirStore } from "@/stores/zikir-store";
import { useZikirText } from "./use-zikir-text";

export function HistoryList() {
  const t = useTranslations("zikir.history");
  const tEditor = useTranslations("zikir.editor");
  const tStats = useTranslations("zikir.stats");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const text = useZikirText();
  const history = useZikirStore((s) => s.history);
  const [confirming, setConfirming] = useState(false);

  if (history.length === 0) return <EmptyState>{t("empty")}</EmptyState>;

  const nameOf = (entry: (typeof history)[number]) =>
    entry.name ?? (entry.kind === "item" ? text.itemView(entry.refId)?.name : text.groupView(entry.refId)?.name) ?? tStats("removed");

  return (
    <section aria-labelledby="zikir-history-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="zikir-history-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <Button variant="outline" onClick={() => setConfirming(true)}>
          <Trash2Icon />
          {t("clear")}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {history.slice(0, 100).map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{nameOf(entry)}</p>
              <p className="text-xs text-muted-foreground">
                {t("counts", { count: entry.count })} · {format.relativeTime(entry.finishedAt, now)}
              </p>
            </div>
            <Badge variant={entry.completed ? "secondary" : "outline"}>{entry.completed ? t("completed") : t("early")}</Badge>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("clearTitle")}
        description={t("clearDescription")}
        confirmLabel={t("clear")}
        cancelLabel={tEditor("cancel")}
        destructive
        onConfirm={() => {
          useZikirStore.getState().clearHistory();
          toast(t("cleared"));
        }}
      />
    </section>
  );
}
