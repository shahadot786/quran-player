import { DEFAULT_WIDGET_RECITER, normalizeHex, normalizeHost, parseEmbedOptions, type SearchParams } from "./options";

export type Kind = "web" | "app";

/** What the builder form holds. Colours and the name are kept as typed, so half-typed text is not thrown away. */
export type Settings = {
  kind: Kind;
  name: string;
  theme: "auto" | "light" | "dark";
  lang: "en" | "bn";
  size: "full" | "compact";
  style: "koi" | "tilawah";
  radius: "sm" | "md" | "lg";
  reciter: number;
  accent: string;
  bg: string;
  card: string;
  text: string;
};

export const COLOR_FIELDS = ["accent", "bg", "card", "text"] as const;
export const MAX_NAME_LENGTH = 100;

export const DEFAULT_SETTINGS: Settings = {
  kind: "web",
  name: "",
  theme: "auto",
  lang: "en",
  size: "full",
  style: "koi",
  radius: "md",
  reciter: DEFAULT_WIDGET_RECITER,
  accent: "",
  bg: "",
  card: "",
  text: "",
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** A web address or a plain name becomes a host name the tracker accepts; null when nothing usable is left. */
export function hostFromName(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text) || (/^[^\s/]+\.[^\s/]+/.test(text) && !/\s/.test(text))) {
    try {
      return normalizeHost(new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`).hostname);
    } catch {
      return null;
    }
  }
  return normalizeHost(text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64));
}

export const placeholderHost = (target: Kind) => (target === "web" ? "my-site" : "my-app");

export const hostFor = (settings: Settings, target: Kind) => hostFromName(settings.name) ?? placeholderHost(target);

export const isColor = (value: string) => normalizeHex(value) !== null;

/** Only what differs from the defaults, in a fixed order; invalid colours are left out. */
export function embedEntries(settings: Settings): [string, string][] {
  const entries: [string, string][] = [];
  if (settings.theme !== DEFAULT_SETTINGS.theme) entries.push(["theme", settings.theme]);
  if (settings.lang !== DEFAULT_SETTINGS.lang) entries.push(["lang", settings.lang]);
  if (settings.size !== DEFAULT_SETTINGS.size) entries.push(["size", settings.size]);
  if (settings.style !== DEFAULT_SETTINGS.style) entries.push(["style", settings.style]);
  if (settings.reciter !== DEFAULT_SETTINGS.reciter) entries.push(["reciter", String(settings.reciter)]);
  for (const field of COLOR_FIELDS) {
    const color = normalizeHex(settings[field]);
    if (color) entries.push([field, color]);
  }
  if (settings.radius !== DEFAULT_SETTINGS.radius) entries.push(["radius", settings.radius]);
  return entries;
}

export function embedUrl(origin: string, settings: Settings, extra: [string, string][] = []) {
  const query = new URLSearchParams([...embedEntries(settings), ...extra]).toString();
  return `${origin}/embed${query ? `?${query}` : ""}`;
}

/** The address the builder page keeps in sync, so a link to it reopens the same settings. */
export function settingsQuery(settings: Settings) {
  const entries = embedEntries(settings);
  if (settings.kind !== DEFAULT_SETTINGS.kind) entries.unshift(["kind", settings.kind]);
  if (settings.name.trim()) entries.unshift(["name", settings.name.trim()]);
  return new URLSearchParams(entries).toString();
}

export function settingsFromParams(params: SearchParams): Settings {
  const options = parseEmbedOptions(params);
  return {
    kind: first(params.kind) === "app" ? "app" : "web",
    name: (first(params.name) ?? "").slice(0, MAX_NAME_LENGTH),
    theme: options.theme,
    lang: options.lang,
    size: options.size,
    style: options.style,
    radius: options.radius,
    reciter: options.reciter,
    accent: options.colors.accent ?? "",
    bg: options.colors.bg ?? "",
    card: options.colors.card ?? "",
    text: options.colors.text ?? "",
  };
}
