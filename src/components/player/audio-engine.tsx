"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { useMediaSession } from "@/hooks/use-media-session";
import { useDownloadsStore } from "@/stores/downloads-store";
import { useHydrated } from "@/stores/hydration";
import { usePlayerStore } from "@/stores/player-store";

function Engine() {
  const t = useTranslations();
  const onError = useCallback(() => {
    toast.error(t("player.error"), {
      id: "player-error",
      action: { label: t("player.retry"), onClick: () => usePlayerStore.getState().load(true) },
    });
  }, [t]);
  useEffect(() => {
    useDownloadsStore.getState().load();
  }, []);
  useAudioEngine(onError);
  useMediaSession(t("app.name"));
  return null;
}

export function AudioEngine() {
  const hydrated = useHydrated();
  return hydrated ? <Engine /> : null;
}
