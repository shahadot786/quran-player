"use client";

import Link from "next/link";
import { EllipsisIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { runProgress, type GroupView, type ItemView } from "@/lib/zikir/view";
import { GoalLine } from "./goal-line";
import { runKey, useZikirStore } from "@/stores/zikir-store";

type Props = {
  kind: "item" | "group";
  view: ItemView | GroupView;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function ZikirCard({ kind, view, onEdit, onDuplicate, onDelete }: Props) {
  const t = useTranslations("zikir.card");
  const n = useLocalizedNumber();
  const run = useZikirStore((s) => s.runs[runKey({ kind, id: view.id })]);
  const isGroup = "steps" in view;
  const progress = runProgress(run, isGroup ? { steps: view.steps, total: view.total } : { target: view.target });
  const summary = isGroup ? view.steps.map((step) => step.name).join(" → ") : view.meaning;
  const arabic = isGroup ? "" : view.arabic;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="truncate font-semibold">{view.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {view.builtIn && <Badge variant="secondary">{t("builtIn")}</Badge>}
            <Badge variant="outline">
              {isGroup
                ? `${t("steps", { count: view.steps.length })} · ${t("counts", { count: view.total })}`
                : view.target === null
                  ? t("unlimited")
                  : t("counts", { count: view.target })}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("options", { name: view.name })}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!view.builtIn && <DropdownMenuItem onSelect={onEdit}>{t("edit")}</DropdownMenuItem>}
            <DropdownMenuItem onSelect={onDuplicate}>{t("duplicate")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {arabic && (
        <p className="line-clamp-2 font-arabic text-2xl leading-relaxed" lang="ar" dir="rtl">
          {arabic}
        </p>
      )}
      {summary && <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>}

      {progress && (
        <div className="flex flex-col gap-1.5">
          <Progress
            value={progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}
            aria-label={t("inProgress", { done: n(progress.done), total: progress.total === null ? "∞" : n(progress.total) })}
            className="h-1.5 **:data-[slot=progress-indicator]:bg-gold"
          />
          <p className="text-xs text-muted-foreground">{t("inProgress", { done: n(progress.done), total: progress.total === null ? "∞" : n(progress.total) })}</p>
        </div>
      )}

      {view.dailyGoal !== null && <GoalLine kind={kind} id={view.id} goal={view.dailyGoal} />}

      <Button asChild className="mt-auto">
        <Link href={`/zikir/${encodeURIComponent(view.id)}`}>{t("count")}</Link>
      </Button>
    </li>
  );
}
