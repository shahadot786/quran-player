import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SyncLink } from "@/components/sync/sync-link";
import { ZikirHome } from "@/components/zikir/zikir-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("zikir");
  return { title: t("title") };
}

export default async function ZikirPage() {
  const t = await getTranslations("zikir");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")}>
        <SyncLink />
      </PageHeader>
      <ZikirHome />
    </>
  );
}
