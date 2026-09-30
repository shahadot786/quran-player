import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { StatsView } from "@/components/stats/stats-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats");
  return { title: t("title") };
}

export default async function StatsPage() {
  const t = await getTranslations("stats");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <StatsView />
    </>
  );
}
