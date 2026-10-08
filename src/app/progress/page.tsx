import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { SyncLink } from "@/components/sync/sync-link";
import { ProgressView } from "@/components/progress/progress-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("progress");
  return { title: t("title") };
}

export default async function ProgressPage() {
  const t = await getTranslations("progress");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")}>
        <SyncLink />
      </PageHeader>
      <ProgressView />
    </>
  );
}
