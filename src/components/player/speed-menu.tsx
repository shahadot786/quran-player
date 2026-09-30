"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLAYBACK_RATES, useSettingsStore } from "@/stores/settings-store";

export function SpeedMenu() {
  const t = useTranslations("player");
  const rate = useSettingsStore((s) => s.rate);
  const setRate = useSettingsStore((s) => s.setRate);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={t("speed")} className="min-w-12 tabular-nums">
              {t("speedValue", { rate })}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("speed")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="center">
        <DropdownMenuLabel>{t("speed")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={String(rate)} onValueChange={(value) => setRate(Number(value))}>
          {PLAYBACK_RATES.map((value) => (
            <DropdownMenuRadioItem key={value} value={String(value)} className="tabular-nums">
              {t("speedValue", { rate: value })}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
