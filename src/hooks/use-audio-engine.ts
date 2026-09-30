"use client";

import { useEffect } from "react";
import { getAudio } from "@/lib/audio";
import { trackKey } from "@/lib/audio-url";
import { COMPLETE_RATIO, consumeResume, selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStatsStore } from "@/stores/stats-store";

const SAVE_INTERVAL_MS = 5000;
const STATS_FLUSH_MS = 10000;
const MAX_TICK_SECONDS = 1.5;
const SKIP_SECONDS = 10;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.getAttribute("role") === "slider";
}

export function useAudioEngine(onError: () => void) {
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    const player = usePlayerStore;

    let lastSave = 0;
    let lastTick: number | null = null;
    let pendingSeconds = 0;
    let lastFlush = performance.now();
    let completedKey: string | null = null;

    const flushStats = () => {
      const track = selectCurrentTrack(player.getState());
      if (track && pendingSeconds > 0) useStatsStore.getState().addListening(pendingSeconds, track);
      pendingSeconds = 0;
      lastFlush = performance.now();
    };

    const applySettings = () => {
      const { volume, muted, rate } = useSettingsStore.getState();
      audio.volume = volume;
      audio.muted = muted;
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
    };

    const onLoadedMetadata = () => {
      const duration = audio.duration;
      const resume = consumeResume(duration);
      if (resume > 0 && resume < duration * COMPLETE_RATIO) audio.currentTime = resume;
      completedKey = null;
      player.getState().sync({ duration, status: "ready" });
    };

    const onTimeUpdate = () => {
      const now = performance.now();
      const state = player.getState();
      const { a, b } = state.loop;
      if (a !== null && b !== null && (audio.currentTime >= b || audio.currentTime < a)) audio.currentTime = a;
      state.sync({ currentTime: audio.currentTime });

      if (!audio.paused && lastTick !== null) {
        const delta = (now - lastTick) / 1000;
        if (delta <= MAX_TICK_SECONDS) pendingSeconds += delta;
      }
      lastTick = audio.paused ? null : now;
      if (now - lastFlush > STATS_FLUSH_MS) flushStats();
      if (now - lastSave > SAVE_INTERVAL_MS) {
        state.savePosition();
        lastSave = now;
      }

      const track = selectCurrentTrack(state);
      if (track && audio.duration && audio.currentTime / audio.duration >= COMPLETE_RATIO) {
        const key = trackKey(track);
        if (completedKey !== key) {
          completedKey = key;
          useStatsStore.getState().markCompleted(track);
        }
      }
    };

    const onPlay = () => player.getState().sync({ isPlaying: true });
    const onPlaying = () => {
      lastTick = performance.now();
      player.getState().sync({ status: "ready", isPlaying: true });
    };
    const onPause = () => {
      lastTick = null;
      flushStats();
      player.getState().sync({ isPlaying: false });
      player.getState().savePosition();
    };
    const onWaiting = () => player.getState().sync({ status: "loading" });
    const onEnded = () => {
      flushStats();
      player.getState().handleEnded();
    };
    const onAudioError = () => {
      if (!audio.src) return;
      player.getState().sync({ status: "error", isPlaying: false });
      onError();
    };
    const onPageHide = () => {
      flushStats();
      player.getState().savePosition();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const state = player.getState();
      if (!selectCurrentTrack(state)) return;
      if (event.code === "Space") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        state.toggle();
      } else if (event.key === "ArrowRight") {
        state.skip(SKIP_SECONDS);
      } else if (event.key === "ArrowLeft") {
        state.skip(-SKIP_SECONDS);
      } else if (event.key.toLowerCase() === "m") {
        useSettingsStore.getState().toggleMute();
      }
    };

    const sleepInterval = window.setInterval(() => {
      const { sleep, pause, setSleep } = player.getState();
      if (sleep.mode === "time" && Date.now() >= sleep.endsAt) {
        pause();
        setSleep({ mode: "off" });
      }
    }, 1000);

    applySettings();
    const unsubscribeSettings = useSettingsStore.subscribe(applySettings);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onAudioError);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("keydown", onKeyDown);

    if (!audio.src && selectCurrentTrack(player.getState())) player.getState().load(false);

    return () => {
      window.clearInterval(sleepInterval);
      unsubscribeSettings();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onAudioError);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onError]);
}
