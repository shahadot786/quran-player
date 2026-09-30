"use client";

import { RepeatIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { usePlayerStore } from "@/stores/player-store";

export function LoopControls() {
  const t = useTranslations("playerPage.loop");
  const loop = usePlayerStore((s) => s.loop);
  const ready = usePlayerStore((s) => s.duration > 0);
  const { setLoopPoint, clearLoop } = usePlayerStore.getState();
  const active = loop.a !== null && loop.b !== null;

  return (
    <section aria-labelledby="loop-heading" className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="loop-heading" className="flex items-center gap-2 text-sm font-semibold">
          <RepeatIcon className="size-4 text-muted-foreground" />
          {t("title")}
        </h2>
        {(loop.a !== null || loop.b !== null) && (
          <Button variant="ghost" size="sm" onClick={clearLoop}>
            <XIcon />
            {t("clear")}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={loop.a !== null ? "secondary" : "outline"} disabled={!ready} onClick={() => setLoopPoint("a")} className="tabular-nums">
          {loop.a !== null ? t("pointA", { time: formatTime(loop.a) }) : t("setA")}
        </Button>
        <Button variant={loop.b !== null ? "secondary" : "outline"} disabled={!ready} onClick={() => setLoopPoint("b")} className="tabular-nums">
          {loop.b !== null ? t("pointB", { time: formatTime(loop.b) }) : t("setB")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {active ? t("active", { start: formatTime(loop.a!), end: formatTime(loop.b!) }) : t("hint")}
      </p>
    </section>
  );
}
