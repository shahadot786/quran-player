import { SITE_URL } from "@/lib/site";

export function detailsUrl({ surah, host }: { surah?: number; host: string | null }) {
  const url = new URL(surah ? `/surahs/${surah}` : "/", SITE_URL);
  url.searchParams.set("utm_source", "widget");
  if (host) url.searchParams.set("utm_medium", host);
  return url.toString();
}
