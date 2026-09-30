"use client";

import { LoaderCircleIcon, PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

const SKIP = 10;

export function PlayPauseButton({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const t = useTranslations("player");
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loading = usePlayerStore((s) => s.status === "loading" && s.isPlaying);
  const hasTrack = usePlayerStore((s) => Boolean(selectCurrentTrack(s)));
  const toggle = usePlayerStore((s) => s.toggle);
  const Icon = loading ? LoaderCircleIcon : isPlaying ? PauseIcon : PlayIcon;

  return (
    <Button
      size="icon"
      disabled={!hasTrack}
      onClick={toggle}
      aria-label={isPlaying ? t("pause") : t("play")}
      className={cn("rounded-full", size === "lg" ? "size-16" : "size-10", className)}
    >
      <Icon className={cn(size === "lg" ? "size-7" : "size-5", loading && "animate-spin", !isPlaying && !loading && "translate-x-px")} fill={loading ? "none" : "currentColor"} />
    </Button>
  );
}

export function TransportControls({ size = "md", showSkip = false }: { size?: "md" | "lg"; showSkip?: boolean }) {
  const t = useTranslations("player");
  const hasTrack = usePlayerStore((s) => Boolean(selectCurrentTrack(s)));
  const { next, prev, skip } = usePlayerStore.getState();
  const buttonSize = size === "lg" ? "icon-lg" : "icon";

  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-4" : "gap-1")}>
      {showSkip && (
        <Button variant="ghost" size={buttonSize} disabled={!hasTrack} onClick={() => skip(-SKIP)} aria-label={t("back10")}>
          <RotateCcwIcon />
        </Button>
      )}
      <Button variant="ghost" size={buttonSize} disabled={!hasTrack} onClick={prev} aria-label={t("previous")}>
        <SkipBackIcon fill="currentColor" />
      </Button>
      <PlayPauseButton size={size} />
      <Button variant="ghost" size={buttonSize} disabled={!hasTrack} onClick={next} aria-label={t("next")}>
        <SkipForwardIcon fill="currentColor" />
      </Button>
      {showSkip && (
        <Button variant="ghost" size={buttonSize} disabled={!hasTrack} onClick={() => skip(SKIP)} aria-label={t("forward10")}>
          <RotateCwIcon />
        </Button>
      )}
    </div>
  );
}
