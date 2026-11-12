"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRehydrateStores } from "@/stores/hydration";

export function Providers({ children }: { children: ReactNode }) {
  useRehydrateStores();
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>;
}
