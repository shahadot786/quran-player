"use client";

import { useEffect, useRef } from "react";
import { hostFromReferrer } from "@/lib/embed/host";
import { trackWidget } from "@/lib/widget/track-client";
import type { WidgetEvent } from "@/lib/widget/server/store";

/** One `view` per page load, one `play` per surah per page load, and `click` whenever asked. */
export function useEmbedTracking(host: string | null, playingSurah: number | null, enabled = true) {
  const resolved = useRef<string | null>(null);
  const viewed = useRef(false);
  const played = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled) return;
    resolved.current = host ?? hostFromReferrer(document.referrer, location.hostname);
    if (viewed.current) return;
    viewed.current = true;
    trackWidget("view", resolved.current);
  }, [host, enabled]);

  useEffect(() => {
    if (!enabled || playingSurah === null || played.current.has(playingSurah)) return;
    played.current.add(playingSurah);
    trackWidget("play", resolved.current);
  }, [playingSurah, enabled]);

  return (event: WidgetEvent) => {
    if (enabled) trackWidget(event, resolved.current);
  };
}
