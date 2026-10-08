import { hasSlice, type Slices } from "@/lib/progress/slices";

const BARS = 100;
const SLICES_PER_BAR = 2;

// Each bar covers two of the 200 slices, so it can be fully, half or not heard.
export function HeatStrip({ slices, label }: { slices: Slices | undefined; label: string }) {
  return (
    <div role="img" aria-label={label} className="grid h-8 overflow-hidden rounded-md bg-muted" style={{ gridTemplateColumns: `repeat(${BARS}, minmax(0, 1fr))` }}>
      {Array.from({ length: BARS }, (_, bar) => {
        const heard = slices ? Array.from({ length: SLICES_PER_BAR }, (_, i) => hasSlice(slices, bar * SLICES_PER_BAR + i)).filter(Boolean).length : 0;
        return <span key={bar} className="bg-gold" style={{ opacity: heard / SLICES_PER_BAR }} />;
      })}
    </div>
  );
}
