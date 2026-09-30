import type messages from "../../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "en" | "bn";
    Messages: typeof messages;
  }
}
