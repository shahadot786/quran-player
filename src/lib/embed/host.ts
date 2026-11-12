import { normalizeHost } from "./options";

/** The site that embeds the widget, from the page address the browser reports as the referrer. */
export function hostFromReferrer(referrer: string, ownHost: string): string | null {
  try {
    const host = normalizeHost(new URL(referrer).hostname);
    return host && host !== normalizeHost(ownHost) ? host : null;
  } catch {
    return null;
  }
}
