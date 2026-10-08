import type { SliceLookup } from "./calc";
import { decodeSlices } from "./slices";

// Damaged or missing entries read as unheard, so a bad saved value can never break the page.
export function sliceLookup(slices: Record<number, string>): SliceLookup {
  const cache = new Map<number, ReturnType<typeof decodeSlices>>();
  return (surah) => {
    if (!cache.has(surah)) cache.set(surah, slices[surah] ? decodeSlices(slices[surah]) : null);
    return cache.get(surah) ?? undefined;
  };
}
