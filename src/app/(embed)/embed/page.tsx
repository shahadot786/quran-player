import { NextIntlClientProvider } from "next-intl";
import { EmbedRoot } from "@/components/embed/embed-root";
import { EmbedWidget } from "@/components/embed/embed-widget";
import { parseEmbedOptions, type SearchParams } from "@/lib/embed/options";
import { getWidgetReciters } from "@/lib/embed/reciters";

export default async function EmbedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const options = parseEmbedOptions(await searchParams);
  const [messages, reciters] = await Promise.all([
    import(`../../../../messages/${options.lang}.json`).then((module) => module.default),
    getWidgetReciters(),
  ]);
  const { embed, app, player, surahs } = messages;
  return (
    <NextIntlClientProvider locale={options.lang} messages={{ embed, app, player, surahs }}>
      <EmbedRoot options={options}>
        <EmbedWidget reciters={reciters} options={options} />
      </EmbedRoot>
    </NextIntlClientProvider>
  );
}
