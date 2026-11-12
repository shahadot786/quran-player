"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function ThemeScope({ forcedTheme, toasts = true, children }: { forcedTheme?: "light" | "dark"; toasts?: boolean; children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange forcedTheme={forcedTheme}>
      {children}
      {toasts && <Toaster position="top-center" />}
    </ThemeProvider>
  );
}
