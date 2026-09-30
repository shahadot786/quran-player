import { starPoints } from "@/lib/star";
import { cn } from "@/lib/utils";

const STAR_POINTS = starPoints(24, 23, 18.5);

export function SurahMark({ number, active = false, className }: { number: number; active?: boolean; className?: string }) {
  return (
    <span className={cn("relative grid size-10 shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 48 48" aria-hidden className={cn("absolute inset-0 size-full", active ? "text-gold" : "text-primary/25")}>
        <polygon points={STAR_POINTS} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className={cn("relative text-xs font-semibold tabular-nums", active && "text-gold")}>{number}</span>
    </span>
  );
}
