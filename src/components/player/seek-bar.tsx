"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function SeekBar({ className }: { className?: string }) {
  const t = useTranslations("player");
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = isDragging && dragValue !== null ? dragValue : currentTime;

  return (
    <div className={cn("flex w-full items-center gap-3 text-xs text-muted-foreground tabular-nums", className)}>
      <span className="w-12 text-right">{formatTime(shown)}</span>
      <Slider
        aria-label={t("seek")}
        min={0}
        max={duration || 1}
        step={1}
        value={[Math.min(shown, duration || 1)]}
        disabled={!duration}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onValueChange={([value]) => {
          if (isDragging) {
            setDragValue(value ?? 0);
          } else {
            seek(value ?? 0);
            setDragValue(null);
          }
        }}
        onValueCommit={([value]) => {
          setIsDragging(false);
          seek(value ?? 0);
          setDragValue(null);
        }}
        className="**:data-[slot=slider-range]:bg-gold"
      />
      <span className="w-12">{formatTime(duration)}</span>
    </div>
  );
}
