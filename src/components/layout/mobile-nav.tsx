"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { EllipsisIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MORE_NAV, PRIMARY_NAV, isActive } from "./nav-items";

const itemClass =
  "flex min-w-0 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground outline-none focus-visible:bg-accent";

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_NAV.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav aria-label={t("label")} className="grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {PRIMARY_NAV.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(itemClass, active && "text-primary")}>
              <Icon className="size-5" />
              {t(key)}
            </Link>
          );
        })}
        <button type="button" aria-haspopup="dialog" onClick={() => setMoreOpen(true)} className={cn(itemClass, moreActive && "text-primary")}>
          <EllipsisIcon className="size-5" />
          {t("more")}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="gap-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>{t("moreTitle")}</SheetTitle>
            <SheetDescription>{t("moreDescription")}</SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-1 p-4 pt-0">
            {MORE_NAV.map(({ href, key, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                      active && "bg-accent text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
