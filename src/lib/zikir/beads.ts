export const BEAD_COUNT = 33;
export const MAX_BEADS = 100;
const REST_ANGLE = -Math.PI / 2;
// A reset can jump this many beads at once before the string snaps instead of spinning back.
const SNAP_BEADS = 3;

export const beadStep = (beads = BEAD_COUNT) => (Math.PI * 2) / beads;

// Where the loop is turned to after `count` counts: the marker bead is at the thumb at the start and every count moves one bead past it.
export const ringOffset = (count: number, beads = BEAD_COUNT) => REST_ANGLE + count * beadStep(beads);

export const activeBead = (count: number, beads = BEAD_COUNT) => (beads - (count % beads)) % beads;

export const shouldSnap = (current: number, target: number, beads = BEAD_COUNT) => Math.abs(target - current) > SNAP_BEADS * beadStep(beads);

// One bead per count of the target, so a round is one trip around the loop; long or unlimited rounds use the largest string.
export const beadsFor = (target: number | null) => (target === null ? MAX_BEADS : Math.min(MAX_BEADS, Math.max(1, Math.round(target))));

// Beads shrink as the string gets longer, nearly touching like a real misbaha, and stop growing on short strings.
export const beadRadius = (beads: number, loopRadius: number) => Math.min(0.26, ((Math.PI * loopRadius) / beads) * 0.47);

export function litTicks(ratio: number | null, ticks: number) {
  if (ratio === null) return 0;
  return Math.round(Math.min(1, Math.max(0, ratio)) * ticks);
}
