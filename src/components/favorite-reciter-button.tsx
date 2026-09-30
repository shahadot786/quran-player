"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/stores/library-store";

export function FavoriteReciterButton({ id, name }: { id: number; name: string }) {
  const t = useTranslations("reciter");
  const isFavorite = useLibraryStore((s) => s.favoriteReciters.some((r) => r.id === id));
  const toggle = useLibraryStore((s) => s.toggleFavoriteReciter);
  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("unfavorite") : t("favorite")}
      onClick={() => toggle({ id, name })}
    >
      <HeartIcon className={cn(isFavorite && "fill-current text-primary")} />
    </Button>
  );
}
