import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-xl border border-dashed px-5 py-8 text-sm text-muted-foreground", className)}>
      <p className="max-w-prose">{children}</p>
      {action}
    </div>
  );
}
