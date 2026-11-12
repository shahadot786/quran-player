import type { CSSProperties } from "react";
import { readableOn, type EmbedOptions } from "./options";

const RADIUS = { sm: "0.5rem", md: "0.75rem", lg: "1rem" } as const;

/** Inline CSS variables for the host's own colours; only values that passed hex validation get here. */
export function embedStyleVars({ colors, radius }: Pick<EmbedOptions, "colors" | "radius">): CSSProperties {
  const vars: Record<string, string> = { "--radius": RADIUS[radius] };
  if (colors.accent) {
    vars["--primary"] = colors.accent;
    vars["--ring"] = colors.accent;
    vars["--primary-foreground"] = readableOn(colors.accent);
  }
  if (colors.bg) vars["--background"] = colors.bg;
  if (colors.card) {
    vars["--card"] = colors.card;
    vars["--popover"] = colors.card;
  }
  if (colors.text) {
    vars["--foreground"] = colors.text;
    vars["--card-foreground"] = colors.text;
    vars["--popover-foreground"] = colors.text;
  }
  return vars as CSSProperties;
}
