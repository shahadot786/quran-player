"use client";

import { useMemo } from "react";
import { buildProgressModel } from "@/lib/progress/model";
import { useProgressStore } from "@/stores/progress-store";

export function useProgressModel() {
  const slices = useProgressStore((s) => s.slices);
  const paceSeconds = useProgressStore((s) => s.paceSeconds);
  const paceAyahs = useProgressStore((s) => s.paceAyahs);
  return useMemo(() => buildProgressModel({ slices, paceSeconds, paceAyahs }), [slices, paceSeconds, paceAyahs]);
}
