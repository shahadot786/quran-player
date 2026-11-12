import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { SurahMark } from "@/components/surah-mark";
import { SurahReciters } from "@/components/surah-reciters";
import { Badge } from "@/components/ui/badge";
import { getReciters } from "@/lib/api/reciters";
import { getLocalizedSurahName, getLocalizedSurahTranslation } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";

export async function generateMetadata({ params }: PageProps<"/surahs/[id]">): Promise<Metadata> {
  const surah = getSurah(Number((await params).id));
  return { title: surah ? `${surah.name} (${surah.translation})` : undefined };
}

export default async function SurahPage({ params }: PageProps<"/surahs/[id]">) {
  const id = Number((await params).id);
  const surah = Number.isInteger(id) ? getSurah(id) : undefined;
  if (!surah) notFound();
  const locale = await getLocale();
  const t = await getTranslations("surahs");
  const surahDisplayName = getLocalizedSurahName(surah, locale);
  const surahDisplayTranslation = getLocalizedSurahTranslation(surah, locale);

  const reciters = await getReciters();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <SurahMark number={surah.id} />
            <Badge variant="secondary">{t(surah.revelation)}</Badge>
            <Badge variant="outline">{t("verses", { count: surah.versesCount })}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{surahDisplayName}</h1>
          <p className="text-muted-foreground">{surahDisplayTranslation}</p>
        </div>
        <p className="font-arabic text-6xl leading-tight text-primary sm:text-7xl" lang="ar" dir="rtl">
          {surah.arabicName}
        </p>
      </header>
      <SurahReciters surah={surah} reciters={reciters} />
    </div>
  );
}
