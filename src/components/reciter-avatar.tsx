import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReciterAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground", className)}
    >
      {initials(name)}
    </span>
  );
}
