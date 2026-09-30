"use client";

import { useEffect } from "react";
import { getSurah } from "@/lib/surahs";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";

const SEEK_OFFSET = 10;

export function useMediaSession(appName: string) {
  const track = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => Math.floor(s.currentTime / 5));
  const rate = useSettingsStore((s) => s.rate);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const player = usePlayerStore.getState;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => player().play()],
      ["pause", () => player().pause()],
      ["nexttrack", () => player().next()],
      ["previoustrack", () => player().prev()],
      ["seekforward", (d) => player().skip(d.seekOffset ?? SEEK_OFFSET)],
      ["seekbackward", (d) => player().skip(-(d.seekOffset ?? SEEK_OFFSET))],
      ["seekto", (d) => d.seekTime !== undefined && player().seek(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {}
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    const surah = getSurah(track.surah);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: surah ? `${surah.id}. ${surah.name}` : String(track.surah),
      artist: track.reciterName,
      album: appName,
      artwork: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }, [track, appName]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration || !Number.isFinite(duration)) return;
    const { currentTime: position } = usePlayerStore.getState();
    try {
      navigator.mediaSession.setPositionState({ duration, position: Math.min(position, duration), playbackRate: rate });
    } catch {}
  }, [duration, currentTime, rate]);
}
