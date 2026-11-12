import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SurahBrowser } from "@/components/surah-browser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("surahs");
  return { title: t("title") };
}

export default async function SurahsPage() {
  const t = await getTranslations("surahs");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <SurahBrowser />
    </>
  );
}
