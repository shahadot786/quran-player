"use client";

import { Repeat1Icon, RepeatIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";

export function RepeatButton() {
  const t = useTranslations("player.repeat");
  const repeat = useSettingsStore((s) => s.repeat);
  const cycleRepeat = useSettingsStore((s) => s.cycleRepeat);
  const Icon = repeat === "one" ? Repeat1Icon : RepeatIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleRepeat}
          aria-label={t(repeat)}
          aria-pressed={repeat !== "off"}
          className={cn(repeat !== "off" && "text-primary")}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t(repeat)}</TooltipContent>
    </Tooltip>
  );
}
