import { AudioLinesIcon, BookOpenIcon, ChartColumnIcon, HouseIcon, LibraryIcon, MicVocalIcon, TargetIcon } from "lucide-react";

// "primary" items sit in the phone's bottom bar; the rest go behind its More button. The sidebar lists everything.
export const NAV_ITEMS = [
  { href: "/", key: "home", icon: HouseIcon, group: "primary" },
  { href: "/player", key: "player", icon: AudioLinesIcon, group: "primary" },
  { href: "/reciters", key: "reciters", icon: MicVocalIcon, group: "more" },
  { href: "/surahs", key: "surahs", icon: BookOpenIcon, group: "more" },
  { href: "/library", key: "library", icon: LibraryIcon, group: "primary" },
  { href: "/progress", key: "progress", icon: TargetIcon, group: "primary" },
  { href: "/stats", key: "stats", icon: ChartColumnIcon, group: "more" },
] as const;

export const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.group === "primary");
export const MORE_NAV = NAV_ITEMS.filter((item) => item.group === "more");

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
