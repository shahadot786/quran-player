import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ReciterGrid } from "@/components/reciter-grid";
import { getReciters, summarize } from "@/lib/api/reciters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reciters");
  return { title: t("title") };
}

export default async function RecitersPage() {
  const t = await getTranslations("reciters");
  const reciters = (await getReciters()).map(summarize);
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle", { count: reciters.length })} />
      <ReciterGrid reciters={reciters} />
    </>
  );
}
