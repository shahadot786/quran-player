import { cn } from "@/lib/utils";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Fills as the count nears its target; a step with no limit shows only the faint track.
export function TargetRing({ ratio, complete, className }: { ratio: number | null; complete: boolean; className?: string }) {
  const filled = complete ? 1 : (ratio ?? 0);
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none absolute inset-0 size-full -rotate-90", className)}>
      <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="4" className="stroke-muted" />
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
        className={cn("transition-[stroke-dashoffset] duration-200 motion-reduce:transition-none", complete ? "stroke-primary" : "stroke-gold")}
      />
    </svg>
  );
}
