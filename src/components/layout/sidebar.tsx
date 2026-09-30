"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { InstallButton } from "./install-button";
import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <SearchCommand variant="wide" />
      <nav aria-label={t("label")} className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center justify-between gap-2 px-1">
        <InstallButton />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
