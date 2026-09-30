import type { Metadata, Viewport } from "next";
import { Amiri, Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SerwistProvider } from "@serwist/turbopack/react";
import { AudioEngine } from "@/components/player/audio-engine";
import { PlayerBar } from "@/components/player/player-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const amiri = Amiri({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  const locale = await getLocale();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quran-player-gamma.vercel.app";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: t("name"),
    title: {
      default: `${t("name")}: ${t("tagline")}`,
      template: `%s | ${t("name")}`,
    },
    description: t("description"),
    keywords: [
      "Quran",
      "Quran Player",
      "Holy Quran Recitation",
      "Islamic Audio Player",
      "Quran Audio Streaming",
      "Surah Player",
      "Quran Reciters",
      "Mishary Rashid Alafasy",
      "Abdul Rahman Al-Sudais",
      "Maher Al-Muaiqly",
      "Bengali Quran Player",
      "কোরআন প্লেয়ার",
      "কুরআন তেলাওয়াত",
      "পবিত্র কুরআন",
      "সূরা",
      "ক্বারী",
    ],
    authors: [{ name: "Quran Player Open Source" }],
    creator: "Quran Player",
    publisher: "Quran Player",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      locale: locale === "bn" ? "bn_BD" : "en_US",
      url: siteUrl,
      title: `${t("name")}: ${t("tagline")}`,
      description: t("description"),
      siteName: t("name"),
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: t("name"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("name")}: ${t("tagline")}`,
      description: t("description"),
      images: ["/icons/icon-512.png"],
    },
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("name") },
    formatDetection: { telephone: false },
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        bn: "/",
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1614" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("nav");
  const appT = await getTranslations("app");
  const locale = await getLocale();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: appT("name"),
    description: appT("description"),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang={locale} suppressHydrationWarning className={`${manrope.variable} ${amiri.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh bg-background" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale}>
          <SerwistProvider swUrl="/serwist/sw.js">
            <Providers>
              <a
                href="#main"
                className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
              >
                {t("skipToContent")}
              </a>
              <div className="flex min-h-dvh">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <MobileHeader />
                  <main id="main" className="flex-1 px-4 pt-6 pb-48 sm:px-6 lg:px-10 lg:pt-10 lg:pb-36">
                    <div className="mx-auto w-full max-w-6xl">{children}</div>
                  </main>
                </div>
              </div>
              <div className="fixed inset-x-0 bottom-0 z-40 lg:left-64">
                <PlayerBar />
                <MobileNav />
              </div>
              <AudioEngine />
            </Providers>
          </SerwistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
