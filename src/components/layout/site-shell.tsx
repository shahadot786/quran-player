import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SerwistProvider } from "@serwist/turbopack/react";
import { PlayerBar } from "@/components/player/player-bar";
import { ReminderNotifier } from "@/components/reminders/reminder-notifier";
import { AutoSync } from "@/components/sync/auto-sync";
import { ThemeScope } from "@/components/theme-scope";
import { MobileHeader } from "./mobile-header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export async function SiteShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("nav");
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <ThemeScope>
        <ReminderNotifier />
        <AutoSync />
        <a
          href="#main"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          {t("skipToContent")}
        </a>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main id="main" className="flex-1 px-4 pt-6 pb-48 sm:px-6 lg:px-10 lg:pt-10 lg:pb-36">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 lg:left-64">
          <PlayerBar />
          <MobileNav />
        </div>
      </ThemeScope>
    </SerwistProvider>
  );
}
