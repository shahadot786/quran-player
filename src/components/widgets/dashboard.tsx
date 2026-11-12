import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/lib/embed/build";
import { RANGES, summarize } from "@/lib/widget/report";
import { cn } from "@/lib/utils";
import { Builder } from "./builder";
import { Guide } from "./guide";
import { LanguageSwitch } from "./language-switch";

export type DashboardData = { status: "ready"; rows: Parameters<typeof summarize>[0] } | { status: "off" } | { status: "failed" };
export type WidgetsTab = "builder" | "numbers" | "guide";

const TABS = [
  { name: "builder", href: "/widgets" },
  { name: "numbers", href: "/widgets?tab=numbers" },
  { name: "guide", href: "/widgets?tab=guide" },
] as const;

async function Numbers({ data, days, host }: { data: DashboardData; days: number; host: string | null }) {
  const t = await getTranslations("widgets");
  const locale = await getLocale();
  const number = new Intl.NumberFormat(locale);
  const percent = (value: number | null) => (value === null ? "–" : `${number.format(value)}%`);
  const report = data.status === "ready" ? summarize(data.rows) : null;
  const th = "px-3 py-2 text-start font-medium text-muted-foreground";
  const td = "px-3 py-2 tabular-nums";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form action="/widgets" method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="tab" value="numbers" />
          <input type="hidden" name="days" value={days} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="numbers-host" className="text-sm font-medium">
              {t("hostFilter")}
            </label>
            <Input id="numbers-host" name="host" defaultValue={host ?? ""} placeholder={t("hostFilterPlaceholder")} maxLength={64} autoComplete="off" spellCheck={false} className="h-9 w-56" />
          </div>
          <Button type="submit" variant="secondary" className="h-9">
            {t("filter")}
          </Button>
          {host && (
            <Button asChild variant="ghost" className="h-9">
              <Link href={`/widgets?tab=numbers&days=${days}`}>{t("showAll")}</Link>
            </Button>
          )}
        </form>
        <Button asChild variant="outline" className="h-9">
          <a href={`/widgets/export?days=${days}${host ? `&host=${host}` : ""}`} download>
            {t("downloadCsv")}
          </a>
        </Button>
      </div>

      <nav aria-label={t("range")} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("range")}</span>
        {RANGES.map((range) => (
          <Link
            key={range}
            href={`/widgets?tab=numbers&days=${range}${host ? `&host=${host}` : ""}`}
            aria-current={range === days ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              range === days ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {t("lastDays", { count: number.format(range) })}
          </Link>
        ))}
      </nav>

      {data.status === "off" && <p role="status" className="rounded-xl border bg-card p-4 text-sm">{t("notCounting")}</p>}
      {data.status === "failed" && <p role="alert" className="rounded-xl border bg-card p-4 text-sm text-destructive">{t("loadFailed")}</p>}

      {report && (
        <>
          <section aria-label={t("title")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={t("views")} value={number.format(report.totals.views)} />
            <StatTile label={t("visitors")} value={number.format(report.totals.visitors)} />
            <StatTile label={t("plays")} value={number.format(report.totals.plays)} />
            <StatTile label={t("clicks")} value={number.format(report.totals.clicks)} hint={`${t("clickRate")}: ${percent(report.totals.clickRate)}`} />
          </section>

          {report.hosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{host ? t("emptyHost", { host }) : t("empty")}</p>
          ) : (
            <>
              <section aria-labelledby="tracker-hosts" className="flex flex-col gap-2">
                <h2 id="tracker-hosts" className="text-lg font-semibold">
                  {t("byHost")}
                </h2>
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th scope="col" className={th}>{t("host")}</th>
                        <th scope="col" className={th}>{t("views")}</th>
                        <th scope="col" className={th}>{t("visitors")}</th>
                        <th scope="col" className={th}>{t("plays")}</th>
                        <th scope="col" className={th}>{t("clicks")}</th>
                        <th scope="col" className={th}>{t("clickRate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.hosts.map((row) => (
                        <tr key={row.host} className="border-b last:border-0">
                          <th scope="row" className={cn(td, "text-start font-medium")}>{row.host}</th>
                          <td className={td}>{number.format(row.views)}</td>
                          <td className={td}>{number.format(row.visitors)}</td>
                          <td className={td}>{number.format(row.plays)}</td>
                          <td className={td}>{number.format(row.clicks)}</td>
                          <td className={td}>{percent(row.clickRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="tracker-days" className="flex flex-col gap-2">
                <h2 id="tracker-days" className="text-lg font-semibold">
                  {t("byDay")}
                </h2>
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th scope="col" className={th}>{t("day")}</th>
                        <th scope="col" className={th}>{t("views")}</th>
                        <th scope="col" className={th}>{t("visitors")}</th>
                        <th scope="col" className={th}>{t("plays")}</th>
                        <th scope="col" className={th}>{t("clicks")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.days.map((row) => (
                        <tr key={row.day} className="border-b last:border-0">
                          <th scope="row" className={cn(td, "text-start font-medium")}>{row.day}</th>
                          <td className={td}>{number.format(row.views)}</td>
                          <td className={td}>{number.format(row.visitors)}</td>
                          <td className={td}>{number.format(row.plays)}</td>
                          <td className={td}>{number.format(row.clicks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <p className="text-xs text-muted-foreground">{t("note")}</p>
            </>
          )}
        </>
      )}
    </>
  );
}

export async function Dashboard({
  tab,
  data,
  days,
  host,
  origin,
  settings,
}: {
  tab: WidgetsTab;
  data: DashboardData;
  days: number;
  host: string | null;
  origin: string;
  settings: Settings;
}) {
  const t = await getTranslations("widgets");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LanguageSwitch />
      </header>

      <nav aria-label={t("tabs.label")} className="flex flex-wrap gap-x-1 border-b">
        {TABS.map(({ name, href }) => (
          <Link
            key={name}
            href={href}
            aria-current={name === tab ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              name === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${name}`)}
          </Link>
        ))}
      </nav>

      {tab === "builder" && <Builder origin={origin} initial={settings} />}
      {tab === "numbers" && <Numbers data={data} days={days} host={host} />}
      {tab === "guide" && <Guide origin={origin} />}
    </main>
  );
}
