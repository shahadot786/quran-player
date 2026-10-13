"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ReminderNotifier } from "@/components/reminders/reminder-notifier";
import { AutoSync } from "@/components/sync/auto-sync";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRehydrateStores } from "@/stores/hydration";

export function Providers({ children }: { children: ReactNode }) {
  useRehydrateStores();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster position="top-center" />
        <ReminderNotifier />
        <AutoSync />
      </TooltipProvider>
    </ThemeProvider>
  );
}
