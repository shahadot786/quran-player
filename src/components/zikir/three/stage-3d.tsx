"use client";

import { useEffect, useRef } from "react";
import { CheckIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { beadsFor } from "@/lib/zikir/beads";
import type { ZikirView } from "@/lib/zikir/types";
import { buildBeadString } from "./bead-string";
import { buildDial } from "./dial";
import { mountScene, type Host } from "./host";
import type { SceneState } from "./types";

type Props = {
  view: Exclude<ZikirView, "simple">;
  label: string;
  count: number;
  target: number | null;
  ratio: number | null;
  complete: boolean;
  still: boolean;
  onCount: () => void;
  onFail: () => void;
};

// The canvas sits inside a real button, so keyboard, screen readers and counting by tap behave exactly as in the plain counter.
export default function Stage3D({ view, label, count, target, ratio, complete, still, onCount, onFail }: Props) {
  const t = useTranslations("zikir.counter");
  const n = useLocalizedNumber();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const parent = useRef<HTMLDivElement>(null);
  const host = useRef<Host | null>(null);
  const latest = useRef<SceneState>({ count, target, ratio, complete });
  const darkNow = useRef(dark);
  const beads = beadsFor(target);

  useEffect(() => {
    if (!parent.current) return;
    const mounted = mountScene(parent.current, view === "dial" ? buildDial : buildBeadString, { dark: darkNow.current, beads, still, onFail });
    host.current = mounted;
    mounted?.controller.setState(latest.current);
    mounted?.invalidate();
    return () => {
      mounted?.dispose();
      host.current = null;
    };
  }, [view, beads, still, onFail]);

  useEffect(() => {
    latest.current = { count, target, ratio, complete };
    host.current?.controller.setState(latest.current);
    host.current?.invalidate();
  }, [count, target, ratio, complete]);

  useEffect(() => {
    darkNow.current = dark;
    host.current?.controller.setDark(dark);
    host.current?.invalidate();
  }, [dark]);

  return (
    <button
      type="button"
      aria-label={label}
      // Counting on press feels immediate and also covers a swipe along the string; a keyboard "click" has detail 0.
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        host.current?.controller.pulse();
        host.current?.invalidate();
        onCount();
      }}
      onClick={(event) => {
        if (event.detail === 0) onCount();
      }}
      className="relative grid size-80 touch-none place-items-center rounded-full outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-96"
    >
      <div ref={parent} aria-hidden className="absolute inset-0" />
      <span className="pointer-events-none relative flex flex-col items-center gap-1">
        {complete ? (
          <CheckIcon className="size-14 text-primary" />
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
