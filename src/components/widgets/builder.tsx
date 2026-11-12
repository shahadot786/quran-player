"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import {
  COLOR_FIELDS,
  DEFAULT_SETTINGS,
  embedUrl,
  hostFromName,
  MAX_NAME_LENGTH,
  placeholderHost,
  settingsQuery,
  type Kind,
  type Settings,
} from "@/lib/embed/build";
import { WIDGET_RECITER_IDS, WIDGET_RECITER_NAMES } from "@/lib/embed/options";
import { snippets } from "@/lib/widget/snippets";
import { ColorField } from "./color-field";
import { CopyButton } from "./copy-button";
import { Preview } from "./preview";
import { Segmented } from "./segmented";

type Target = "script" | "iframe" | "reactNative" | "flutter";

export function Builder({ origin, initial }: { origin: string; initial: Settings }) {
  const t = useTranslations("widgets.builder");
  const guide = useTranslations("widgets.guide");
  const locale = useLocale();
  const [settings, setSettings] = useState(initial);
  const [target, setTarget] = useState<Target>(initial.kind === "app" ? "reactNative" : "script");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  const query = settingsQuery(settings);
  useEffect(() => {
    window.history.replaceState(null, "", query ? `/widgets?${query}` : "/widgets");
  }, [query]);

  const host = hostFromName(settings.name);
  const nameInvalid = settings.name.trim() !== "" && !host;
  const code = useMemo(() => snippets(origin, settings), [origin, settings]);
  const placeholder = placeholderHost(settings.kind);
  const previewSrc = embedUrl("", settings, [["preview", "1"]]);

  const chooseKind = (kind: Kind) => {
    set("kind", kind);
    setTarget(kind === "app" ? "reactNative" : "script");
  };

  const targets: { value: Target; label: string }[] = [
    { value: "script", label: t("script") },
    { value: "iframe", label: t("iframe") },
    { value: "reactNative", label: t("reactNative") },
    { value: "flutter", label: t("flutter") },
  ];
  const colorLabels = { accent: t("accent"), bg: t("bg"), card: t("card"), text: t("text") };

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <form onSubmit={(event) => event.preventDefault()} aria-label={t("lookTitle")} className="flex flex-col gap-6">
          <section aria-labelledby="builder-where" className="flex flex-col gap-4">
            <h2 id="builder-where" className="text-lg font-semibold">
              {t("whereTitle")}
            </h2>
            <Segmented
              label={t("kind")}
              value={settings.kind}
              options={[
                { value: "web", label: t("web") },
                { value: "app", label: t("app") },
              ]}
              onChange={chooseKind}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="builder-name">{settings.kind === "web" ? t("nameWeb") : t("nameApp")}</Label>
              <Input
                id="builder-name"
                value={settings.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder={settings.kind === "web" ? t("placeholderWeb") : t("placeholderApp")}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={nameInvalid}
                aria-describedby="builder-name-note"
                className="h-10"
              />
              <p id="builder-name-note" role={nameInvalid ? "alert" : undefined} className={nameInvalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {nameInvalid ? t("hostInvalid") : host ? t("countedAs", { host }) : t("hostHint", { host: placeholder })}
              </p>
            </div>
          </section>

          <section aria-labelledby="builder-look" className="flex flex-col gap-4">
            <h2 id="builder-look" className="text-lg font-semibold">
              {t("lookTitle")}
            </h2>
            <Segmented
              label={t("theme")}
              value={settings.theme}
              options={[
                { value: "auto", label: t("themeAuto") },
                { value: "light", label: t("themeLight") },
                { value: "dark", label: t("themeDark") },
              ]}
              onChange={(value) => set("theme", value)}
            />
            <Segmented
              label={t("style")}
              value={settings.style}
              options={[
                { value: "koi", label: t("styleKoi") },
                { value: "tilawah", label: t("styleTilawah") },
              ]}
              onChange={(value) => set("style", value)}
            />
            <Segmented
              label={t("size")}
              value={settings.size}
              options={[
                { value: "full", label: t("sizeFull") },
                { value: "compact", label: t("sizeCompact") },
              ]}
              onChange={(value) => set("size", value)}
            />
            <Segmented
              label={t("radius")}
              value={settings.radius}
              options={[
                { value: "sm", label: t("radiusSm") },
                { value: "md", label: t("radiusMd") },
                { value: "lg", label: t("radiusLg") },
              ]}
              onChange={(value) => set("radius", value)}
            />
            <Segmented
              label={t("lang")}
              value={settings.lang}
              options={[
                { value: "en", label: "English" },
                { value: "bn", label: "বাংলা" },
              ]}
              onChange={(value) => set("lang", value)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="builder-reciter">{t("reciter")}</Label>
              <select
                id="builder-reciter"
                value={settings.reciter}
                onChange={(event) => set("reciter", Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {WIDGET_RECITER_IDS.map((id) => (
                  <option key={id} value={id}>
                    {getLocalizedReciterName(WIDGET_RECITER_NAMES[id], locale)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section aria-labelledby="builder-colors" className="flex flex-col gap-4">
            <div>
              <h2 id="builder-colors" className="text-lg font-semibold">
                {t("colorsTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("colorsHelp")}</p>
            </div>
            {COLOR_FIELDS.map((field) => (
              <ColorField
                key={field}
                label={colorLabels[field]}
                value={settings[field]}
                onChange={(value) => set(field, value)}
                invalidText={t("colorInvalid")}
                pickLabel={t("pickColor", { name: colorLabels[field] })}
                clearLabel={t("clearColor", { name: colorLabels[field] })}
              />
            ))}
          </section>

          <Button type="button" variant="outline" onClick={() => {
              setSettings(DEFAULT_SETTINGS);
              setTarget("script");
            }}>
            {t("reset")}
          </Button>
        </form>

        <div className="flex min-w-0 flex-col gap-8">
          <Preview
            src={previewSrc}
            title={t("previewTitle")}
            help={t("previewHelp")}
            deviceLabel={t("deviceLabel")}
            devices={[
              { value: "phone", label: t("phone") },
              { value: "tablet", label: t("tablet") },
              { value: "wide", label: t("wide") },
            ]}
            openLabel={t("openPreview")}
          />

          <section aria-labelledby="builder-code" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="builder-code" className="text-lg font-semibold">
                {t("codeTitle")}
              </h2>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={`${origin}/widgets${query ? `?${query}` : ""}`} label={t("copyLink")} copiedLabel={guide("copied")} ariaLabel={t("copyLink")} />
                <CopyButton text={embedUrl(origin, settings, [["host", host ?? placeholder]])} label={t("copyAddress")} copiedLabel={guide("copied")} ariaLabel={t("copyAddress")} />
              </div>
            </div>
            <Tabs value={target} onValueChange={(value) => setTarget(value as Target)}>
              <TabsList aria-label={t("targetLabel")} className="h-auto flex-wrap">
                {targets.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {targets.map(({ value, label }) => (
                <TabsContent key={value} value={value} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <CopyButton text={code[value]} label={guide("copy")} copiedLabel={guide("copied")} ariaLabel={`${guide("copyCode")}: ${label}`} />
                  </div>
                  <pre tabIndex={0} aria-label={label} className="overflow-x-auto rounded-xl border bg-muted p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <code>{code[value]}</code>
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  );
}
