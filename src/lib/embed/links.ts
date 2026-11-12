import { SITE_URL } from "@/lib/site";

/** A link into the main site that says it came from the widget, and from which host. */
export function siteLink(path: "/" | "/player", host: string | null) {
  const url = new URL(path, SITE_URL);
  url.searchParams.set("utm_source", "widget");
  if (host) url.searchParams.set("utm_medium", host);
  return url.toString();
}
