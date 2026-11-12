import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CounterView } from "@/components/zikir/counter-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("zikir");
  return { title: t("title") };
}

export default async function CounterPage({ params }: PageProps<"/zikir/[id]">) {
  const { id } = await params;
  return <CounterView id={decodeURIComponent(id)} />;
}
