"use client";

import { Volume1Icon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSettingsStore } from "@/stores/settings-store";

export function VolumeControl() {
  const t = useTranslations("player");
  const volume = useSettingsStore((s) => s.volume);
  const muted = useSettingsStore((s) => s.muted);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const toggleMute = useSettingsStore((s) => s.toggleMute);
  const silent = muted || volume === 0;
  const Icon = silent ? VolumeXIcon : volume < 0.5 ? Volume1Icon : Volume2Icon;

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={silent ? t("unmute") : t("mute")}>
        <Icon />
      </Button>
      <Slider
        aria-label={t("volume")}
        className="w-24"
        min={0}
        max={1}
        step={0.01}
        value={[muted ? 0 : volume]}
        onValueChange={([value]) => setVolume(value ?? 0)}
      />
    </div>
  );
}
