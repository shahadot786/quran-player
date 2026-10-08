export const BEAD_COUNT = 33;
const REST_ANGLE = -Math.PI / 2;
// A reset can jump this many beads at once before the string snaps instead of spinning back.
const SNAP_BEADS = 3;

export const beadStep = (beads = BEAD_COUNT) => (Math.PI * 2) / beads;

// Where the loop is turned to after `count` counts: the marker bead is at the thumb at the start and every count moves one bead past it.
export const ringOffset = (count: number, beads = BEAD_COUNT) => REST_ANGLE + count * beadStep(beads);

export const activeBead = (count: number, beads = BEAD_COUNT) => (beads - (count % beads)) % beads;

export const shouldSnap = (current: number, target: number, beads = BEAD_COUNT) => Math.abs(target - current) > SNAP_BEADS * beadStep(beads);

export function litTicks(ratio: number | null, ticks: number) {
  if (ratio === null) return 0;
  return Math.round(Math.min(1, Math.max(0, ratio)) * ticks);
}
