"use client";

import { MoonStarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePlayerStore, type SleepTimer } from "@/stores/player-store";

export const SLEEP_MINUTES = [15, 30, 45, 60] as const;

function useRemaining(sleep: SleepTimer) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (sleep.mode !== "time") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sleep.mode]);
  return sleep.mode === "time" ? Math.max(0, (sleep.endsAt - now) / 1000) : 0;
}

function sleepValue(sleep: SleepTimer) {
  return sleep.mode === "time" ? "time" : sleep.mode;
}

export function SleepTimerMenu() {
  const t = useTranslations("player.sleep");
  const sleep = usePlayerStore((s) => s.sleep);
  const setSleep = usePlayerStore((s) => s.setSleep);
  const remaining = useRemaining(sleep);
  const label = sleep.mode === "time" ? t("active", { time: formatTime(remaining) }) : sleep.mode === "end" ? t("activeEnd") : t("label");

  const choose = (value: string) => {
    if (value === "off") {
      setSleep({ mode: "off" });
      toast(t("cleared"));
    } else if (value === "end") {
      setSleep({ mode: "end" });
      toast(t("set"), { description: t("activeEnd") });
    } else {
      const minutes = Number(value);
      setSleep({ mode: "time", endsAt: Date.now() + minutes * 60_000 });
      toast(t("set"), { description: t("minutes", { count: minutes }) });
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={sleep.mode === "off" ? "icon" : "sm"}
              aria-label={label}
              className={cn(sleep.mode !== "off" && "text-primary tabular-nums")}
            >
              <MoonStarIcon />
              {sleep.mode === "time" && formatTime(remaining)}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="center">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sleepValue(sleep)} onValueChange={choose}>
          <DropdownMenuRadioItem value="off">{t("off")}</DropdownMenuRadioItem>
          {SLEEP_MINUTES.map((minutes) => (
            <DropdownMenuRadioItem key={minutes} value={String(minutes)}>
              {t("minutes", { count: minutes })}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value="end">{t("end")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
