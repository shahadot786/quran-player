export const SLICE_COUNT = 200;
export const FINISHED_SLICES = 190;
export const FINISHED_RATIO = FINISHED_SLICES / SLICE_COUNT;

const BYTES = SLICE_COUNT / 8;
const POPCOUNT = Array.from({ length: 256 }, (_, n) => n.toString(2).replace(/0/g, "").length);

export type Slices = Uint8Array;

export const emptySlices = (): Slices => new Uint8Array(BYTES);

export function fullSlices(): Slices {
  return new Uint8Array(BYTES).fill(0xff);
}

export const hasSlice = (slices: Slices, index: number) => ((slices[index >> 3]! >> (index & 7)) & 1) === 1;

const clampIndex = (index: number) => Math.min(SLICE_COUNT - 1, Math.max(0, index));

// A slice counts as heard once playback has entered it, and one that playback only reaches the edge of stays unheard.
export function markRange(slices: Slices, from: number, to: number): Slices {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return slices;
  const first = clampIndex(Math.floor(from * SLICE_COUNT));
  const last = clampIndex(Math.max(first, Math.ceil(to * SLICE_COUNT) - 1));
  const next = slices.slice();
  for (let index = first; index <= last; index += 1) next[index >> 3]! |= 1 << (index & 7);
  return next;
}

// Marks only the slices that were completely passed, which is the safe reading of a saved resume point.
export function markUpTo(slices: Slices, ratio: number): Slices {
  if (!Number.isFinite(ratio) || ratio <= 0) return slices;
  const passed = Math.min(SLICE_COUNT, Math.floor(ratio * SLICE_COUNT));
  if (passed === 0) return slices;
  const next = slices.slice();
  for (let index = 0; index < passed; index += 1) next[index >> 3]! |= 1 << (index & 7);
  return next;
}

export function countSlices(slices: Slices): number {
  return slices.reduce((total, byte) => total + POPCOUNT[byte]!, 0);
}

export const isFinished = (slices: Slices) => countSlices(slices) >= FINISHED_SLICES;

export function unionSlices(a: Slices, b: Slices): Slices {
  return a.map((byte, index) => byte | b[index]!);
}

// The share of the range [start, end) in slice units that has been heard; the ends may fall inside a slice.
export function rangeCoverage(slices: Slices, start: number, end: number): number {
  if (!(end > start)) return 0;
  let heard = 0;
  for (let index = Math.floor(start); index < Math.ceil(end) && index < SLICE_COUNT; index += 1) {
    if (hasSlice(slices, index)) heard += Math.min(end, index + 1) - Math.max(start, index);
  }
  return heard / (end - start);
}

export function encodeSlices(slices: Slices): string {
  return btoa(String.fromCharCode(...slices)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSlices(text: string): Slices | null {
  if (typeof text !== "string" || !/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "="));
    return binary.length === BYTES ? Uint8Array.from(binary, (char) => char.charCodeAt(0)) : null;
  } catch {
    return null;
  }
}
