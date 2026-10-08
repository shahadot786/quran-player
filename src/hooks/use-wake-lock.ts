"use client";

import { useEffect } from "react";

// Keeps the screen on while counting. The browser drops the lock when the tab is hidden, so it is asked for again on return.
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) await lock.release();
        else sentinel = lock;
      } catch {
        // The browser can refuse, for example on low battery; counting works the same without it.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [enabled]);
}

export const wakeLockSupported = () => typeof navigator !== "undefined" && "wakeLock" in navigator;
