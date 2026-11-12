export const WIDGET_RECITER_IDS = [123, 30, 92, 31, 4] as const;
export const DEFAULT_WIDGET_RECITER = WIDGET_RECITER_IDS[0];

export const WIDGET_RECITER_NAMES: Record<(typeof WIDGET_RECITER_IDS)[number], string> = {
  123: "Mishary Alafasi",
  30: "Saad Al-Ghamdi",
  92: "Yasser Al-Dosari",
  31: "Saud Al-Shuraim",
  4: "Shaik Abu Bakr Al Shatri",
};

export type EmbedColors = Partial<Record<"accent" | "bg" | "card" | "text", string>>;

export type EmbedOptions = {
  theme: "auto" | "light" | "dark";
  lang: "en" | "bn";
  size: "full" | "compact";
  style: "koi" | "tilawah";
  radius: "sm" | "md" | "lg";
  reciter: number;
  colors: EmbedColors;
  host: string | null;
  /** Set by the builder's preview so looking at the widget is not counted as a visit. */
  preview: boolean;
};

export type SearchParams = Record<string, string | string[] | undefined>;

const COLOR_KEYS = ["accent", "bg", "card", "text"] as const;
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HOST = /^[a-z0-9][a-z0-9.-]{0,63}$/;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

/** Returns a 6 or 8 digit lower-case hex colour, or null when the text is not a colour. */
export function normalizeHex(value: string | undefined): string | null {
  const match = value ? HEX.exec(value.trim()) : null;
  if (!match) return null;
  const digits = match[1]!.toLowerCase();
  return `#${digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits}`;
}

/** Black or white, whichever reads better on the colour. */
export function readableOn(hex: string): "#000000" | "#ffffff" {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const linear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

export function normalizeHost(value: string | undefined): string | null {
  const host = value?.trim().toLowerCase().replace(/^www\./, "");
  return host && HOST.test(host) ? host : null;
}

export function parseEmbedOptions(params: SearchParams): EmbedOptions {
  const colors: EmbedColors = {};
  for (const key of COLOR_KEYS) {
    const color = normalizeHex(first(params[key]));
    if (color) colors[key] = color;
  }
  const reciter = Number(first(params.reciter));
  return {
    theme: pick(first(params.theme), ["auto", "light", "dark"], "auto"),
    lang: pick(first(params.lang), ["en", "bn"], "en"),
    size: pick(first(params.size), ["full", "compact"], "full"),
    style: pick(first(params.style), ["koi", "tilawah"], "koi"),
    radius: pick(first(params.radius), ["sm", "md", "lg"], "md"),
    reciter: WIDGET_RECITER_IDS.find((id) => id === reciter) ?? DEFAULT_WIDGET_RECITER,
    colors,
    host: normalizeHost(first(params.host)),
    preview: first(params.preview) === "1",
  };
}
