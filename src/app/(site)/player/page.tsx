import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { PlayerView } from "@/components/player-page/player-view";
import { FEATURED_RECITER_IDS, getReciters } from "@/lib/api/reciters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("playerPage");
  return { title: t("title") };
}

export default async function PlayerPage() {
  const t = await getTranslations("playerPage");
  const reciters = await getReciters();
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <PlayerView reciters={reciters} defaultReciterId={FEATURED_RECITER_IDS[0]!} />
    </>
  );
}
