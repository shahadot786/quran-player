import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ThemeScope } from "@/components/theme-scope";
import { Dashboard, type DashboardData, type WidgetsTab } from "@/components/widgets/dashboard";
import { settingsFromParams } from "@/lib/embed/build";
import { normalizeHost, type SearchParams } from "@/lib/embed/options";
import { SITE_URL } from "@/lib/site";
import { parseRange, sinceDay } from "@/lib/widget/report";
import { widgetDeps } from "@/lib/widget/server/deps";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("widgets");
  return { title: t("title"), description: t("subtitle") };
}

async function load(days: number, host: string | null): Promise<DashboardData> {
  const { store, now } = widgetDeps();
  if (!store) return { status: "off" };
  try {
    const rows = await store.report(sinceDay(days, now()));
    return { status: "ready", rows: host ? rows.filter((row) => row.host === host) : rows };
  } catch {
    return { status: "failed" };
  }
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function WidgetsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tab: WidgetsTab = params.tab === "numbers" ? "numbers" : params.tab === "guide" ? "guide" : "builder";
  const days = parseRange(params.days);
  const host = normalizeHost(first(params.host));
  return (
    <ThemeScope>
      <Dashboard
        tab={tab}
        data={tab === "numbers" ? await load(days, host) : { status: "off" }}
        days={days}
        host={host}
        origin={new URL(SITE_URL).origin}
        settings={settingsFromParams(params)}
      />
    </ThemeScope>
  );
}
