import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title") };
}

export default async function OfflinePage() {
  const t = await getTranslations("offline");
  return (
    <StatusMessage title={t("title")} description={t("description")}>
      <Button asChild>
        <Link href="/library?tab=downloads">{t("openDownloads")}</Link>
      </Button>
    </StatusMessage>
  );
}
