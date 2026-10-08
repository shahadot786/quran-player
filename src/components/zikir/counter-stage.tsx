"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWebGL } from "@/hooks/use-webgl";
import type { ZikirView } from "@/lib/zikir/types";
import { Counter2D } from "./counter-2d";

type Props = {
  view: ZikirView;
  label: string;
  count: number;
  target: number | null;
  ratio: number | null;
  complete: boolean;
  onCount: () => void;
};

function Placeholder() {
  return <div aria-hidden className="size-72 rounded-full bg-muted/40 motion-safe:animate-pulse sm:size-96" />;
}

// three.js is only downloaded when a 3D view is actually going to be shown.
const Stage3D = dynamic(() => import("./three/stage-3d"), { ssr: false, loading: Placeholder });

// Picks the 3D view when it can run, and the plain counter whenever it can't or shouldn't: no WebGL, a lost GPU context, or reduced motion.
export function CounterStage(props: Props) {
  const reducedMotion = useReducedMotion();
  const webgl = useWebGL();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  const { view, ...counter } = props;
  if (view === "simple" || reducedMotion || failed || webgl === false) return <Counter2D {...counter} />;
  if (webgl === null) return <Placeholder />;
  return <Stage3D view={view} {...counter} onFail={onFail} />;
}
