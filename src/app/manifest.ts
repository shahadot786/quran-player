import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");
  return {
    name: `${t("name")}: ${t("tagline")}`,
    short_name: t("name"),
    description: t("description"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8faf9",
    theme_color: "#f8faf9",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
