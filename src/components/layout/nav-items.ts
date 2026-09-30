import { AudioLinesIcon, BookOpenIcon, ChartColumnIcon, HouseIcon, LibraryIcon, MicVocalIcon } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", key: "home", icon: HouseIcon },
  { href: "/player", key: "player", icon: AudioLinesIcon },
  { href: "/reciters", key: "reciters", icon: MicVocalIcon },
  { href: "/surahs", key: "surahs", icon: BookOpenIcon },
  { href: "/library", key: "library", icon: LibraryIcon },
  { href: "/stats", key: "stats", icon: ChartColumnIcon },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
