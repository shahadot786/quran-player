"use client";

import { useEffect, useState } from "react";
import { getAudio } from "@/lib/audio";
import { trackKey } from "@/lib/audio-url";
import { activeAyahAt, fitsDuration, timingsUrl, type SurahTimings } from "@/lib/timings";
import type { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";

export type AyahSync =
  | { status: "unavailable"; timings: null; active: null }
  | { status: "loading"; timings: null; active: null }
  | { status: "ready"; timings: SurahTimings; active: number | null };

const UNAVAILABLE: AyahSync = { status: "unavailable", timings: null, active: null };
const LOADING: AyahSync = { status: "loading", timings: null, active: null };

// Missing timings are remembered, but a failed request isn't, so going back online retries.
const cache = new Map<string, Promise<SurahTimings | null>>();

function loadTimings(track: Track) {
  const key = trackKey(track);
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(timingsUrl(track)).then((res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Timings responded ${res.status}`);
      return res.json() as Promise<SurahTimings>;
    });
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  return pending;
}

// Follows the audio clock every frame while playing, so the highlight moves on the exact ayah boundary.
export function useAyahSync(track: Track | undefined): AyahSync {
  const key = track ? trackKey(track) : null;
  const [loaded, setLoaded] = useState<{ key: string; timings: SurahTimings | null } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const duration = usePlayerStore((s) => s.duration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const canSync = Boolean(track) && track!.synced !== false;

  useEffect(() => {
    if (!track || !canSync) return;
    let cancelled = false;
    loadTimings(track)
      .then((timings) => !cancelled && setLoaded({ key: trackKey(track), timings }))
      .catch(() => !cancelled && setLoaded({ key: trackKey(track), timings: null }));
    return () => {
      cancelled = true;
    };
  }, [track, canSync]);

  const current = loaded?.key === key ? loaded.timings : undefined;
  const timings = current && fitsDuration(current, duration) ? current : null;

  useEffect(() => {
    if (!timings) return;
    const audio = getAudio();
    const update = () => {
      const next = activeAyahAt(timings, audio?.currentTime ?? usePlayerStore.getState().currentTime);
      setActive((previous) => (previous === next ? previous : next));
    };
    update();
    let frame = 0;
    const tick = () => {
      update();
      frame = requestAnimationFrame(tick);
    };
    if (isPlaying) frame = requestAnimationFrame(tick);
    const unsubscribe = usePlayerStore.subscribe(update);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [timings, isPlaying]);

  if (!track || !canSync) return UNAVAILABLE;
  if (current === undefined) return LOADING;
  if (!timings) return UNAVAILABLE;
  return { status: "ready", timings, active };
}
