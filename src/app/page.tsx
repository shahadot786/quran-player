import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContinueListening } from "@/components/home/continue-listening";
import { FavoriteReciters } from "@/components/home/favorite-reciters";
import { HomeHero } from "@/components/home/home-hero";
import { ReciterCard } from "@/components/reciter-card";
import { Button } from "@/components/ui/button";
import { getFeaturedReciters } from "@/lib/api/reciters";

export default async function HomePage() {
  const t = await getTranslations("home");
  const featured = await getFeaturedReciters();

  return (
    <div className="flex flex-col gap-12">
      <HomeHero />
      <ContinueListening />
      <FavoriteReciters />
      <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="featured-heading" className="text-lg font-semibold">
            {t("featured")}
          </h2>
          <Button asChild variant="link">
            <Link href="/reciters">{t("seeAll")}</Link>
          </Button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((reciter) => (
            <li key={reciter.id}>
              <ReciterCard reciter={reciter} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
