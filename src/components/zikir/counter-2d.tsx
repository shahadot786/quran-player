"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { cn } from "@/lib/utils";
import { TargetRing } from "./target-ring";

type Props = { label: string; count: number; target: number | null; ratio: number | null; complete: boolean; onCount: () => void };

// The always-available tasbih: one big button. It is also the fallback for the 3D views.
export function Counter2D({ label, count, target, ratio, complete, onCount }: Props) {
  const t = useTranslations("zikir.counter");
  const n = useLocalizedNumber();
  return (
    <button
      type="button"
      onClick={onCount}
      aria-label={label}
      className={cn(
        "relative grid size-60 place-items-center rounded-full border bg-card shadow-sm outline-none transition-transform select-none sm:size-72",
        "active:scale-95 motion-reduce:active:scale-100 focus-visible:ring-3 focus-visible:ring-ring/50",
        complete && "border-primary motion-safe:animate-pulse",
      )}
    >
      <TargetRing ratio={ratio} complete={complete} />
      <span className="relative flex flex-col items-center gap-1">
        {complete ? (
          <CheckIcon className="size-16 text-primary" />
        ) : (
          <>
            <span className="text-6xl font-semibold tracking-tight tabular-nums">{n(count)}</span>
            {target !== null && <span className="text-sm text-muted-foreground tabular-nums">{t("progress", { done: n(count), total: n(target) })}</span>}
          </>
        )}
      </span>
    </button>
  );
}
