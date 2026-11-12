"use client";

import type { ReactNode } from "react";
import { ThemeScope } from "@/components/theme-scope";
import type { EmbedOptions } from "@/lib/embed/options";
import { embedStyleVars } from "@/lib/embed/theme";

export function EmbedRoot({ options, children }: { options: EmbedOptions; children: ReactNode }) {
  const forced = options.theme === "auto" ? undefined : options.theme;
  return (
    <ThemeScope forcedTheme={forced} toasts={false}>
      <div
        lang={options.lang}
        data-embed-style={options.style}
        data-embed-size={options.size}
        style={embedStyleVars(options)}
        className="min-h-dvh bg-background text-foreground"
      >
        {children}
      </div>
    </ThemeScope>
  );
}
