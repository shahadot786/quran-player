import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ReciterView } from "@/components/reciter-view";
import { FEATURED_RECITER_IDS, getReciter } from "@/lib/api/reciters";
import { getLocalizedReciterName } from "@/lib/bengali-data";

export function generateStaticParams() {
  return FEATURED_RECITER_IDS.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }: PageProps<"/reciters/[id]">): Promise<Metadata> {
  const reciter = await getReciter(Number((await params).id));
  const locale = await getLocale();
  return { title: reciter ? getLocalizedReciterName(reciter.name, locale) : undefined };
}

export default async function ReciterPage({ params }: PageProps<"/reciters/[id]">) {
  const reciter = await getReciter(Number((await params).id));
  if (!reciter) notFound();
  return <ReciterView reciter={reciter} />;
}
