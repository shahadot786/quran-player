import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LibraryTabs } from "@/components/library/library-tabs";
import { LIBRARY_TABS } from "@/components/library/tabs";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("library");
  return { title: t("title") };
}

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const t = await getTranslations("library");
  const { tab } = await searchParams;
  const initialTab = LIBRARY_TABS.find((value) => value === tab) ?? "favorites";
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <LibraryTabs initialTab={initialTab} />
    </>
  );
}
