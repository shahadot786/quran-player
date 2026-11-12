import { getTranslations } from "next-intl/server";
import { snippets } from "@/lib/widget/snippets";
import { CopyButton } from "./copy-button";

const OPTIONS = [
  { name: "theme", values: "auto, light, dark", fallback: "auto" },
  { name: "lang", values: "en, bn", fallback: "en" },
  { name: "size", values: "full, compact", fallback: "full" },
  { name: "style", values: "koi, tilawah", fallback: "koi" },
  { name: "reciter", values: "123, 30, 92, 31, 4", fallback: "123" },
  { name: "accent", values: "#13756a", fallback: "style" },
  { name: "bg", values: "#eef6f3", fallback: "style" },
  { name: "card", values: "#ffffff", fallback: "style" },
  { name: "text", values: "#10251f", fallback: "style" },
  { name: "radius", values: "sm, md, lg", fallback: "md" },
  { name: "host", values: "my-app", fallback: "embedding" },
] as const;

type BlockProps = { id: string; title: string; help: string; text: string; copy: string; copied: string; copyCode: string };

function Block({ id, title, help, text, copy, copied, copyCode }: BlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={id} className="font-semibold">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{help}</p>
        </div>
        <CopyButton text={text} label={copy} copiedLabel={copied} ariaLabel={`${copyCode}: ${title}`} />
      </div>
      <pre tabIndex={0} aria-labelledby={id} className="overflow-x-auto rounded-xl border bg-muted p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export async function Guide({ origin }: { origin: string }) {
  const t = await getTranslations("widgets.guide");
  const code = snippets(origin);
  const labels = { copy: t("copy"), copied: t("copied"), copyCode: t("copyCode") };
  const th = "px-3 py-2 text-start font-medium text-muted-foreground";
  const td = "px-3 py-2 align-top";

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-sm text-muted-foreground">{t("intro")}</p>
      <p role="note" className="max-w-prose rounded-xl border bg-card p-3 text-sm">
        {t("hostTip")}
      </p>

      <section aria-labelledby="guide-web" className="flex flex-col gap-5">
        <h2 id="guide-web" className="text-lg font-semibold">
          {t("webTitle")}
        </h2>
        <Block id="guide-script" title={t("scriptTitle")} help={t("scriptHelp")} text={code.script} {...labels} />
        <Block id="guide-iframe" title={t("iframeTitle")} help={t("iframeHelp")} text={code.iframe} {...labels} />
        <Block id="guide-resize" title={t("resizeTitle")} help={t("resizeHelp")} text={code.resize} {...labels} />
      </section>

      <section aria-labelledby="guide-mobile" className="flex flex-col gap-5">
        <div>
          <h2 id="guide-mobile" className="text-lg font-semibold">
            {t("mobileTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("mobileIntro")}</p>
        </div>
        <Block id="guide-rn" title={t("reactNativeTitle")} help={t("reactNativeHelp")} text={code.reactNative} {...labels} />
        <Block id="guide-flutter" title={t("flutterTitle")} help={t("flutterHelp")} text={code.flutter} {...labels} />
        <p className="max-w-prose text-sm text-muted-foreground">{t("mobileNote")}</p>
      </section>

      <section aria-labelledby="guide-options" className="flex flex-col gap-2">
        <div>
          <h2 id="guide-options" className="text-lg font-semibold">
            {t("optionsTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("optionsIntro")}</p>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className={th}>{t("colOption")}</th>
                <th scope="col" className={th}>{t("colValues")}</th>
                <th scope="col" className={th}>{t("colDefault")}</th>
                <th scope="col" className={th}>{t("colWhat")}</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS.map(({ name, values, fallback }) => (
                <tr key={name} className="border-b last:border-0">
                  <th scope="row" className={`${td} text-start font-mono font-medium`}>{name}</th>
                  <td className={`${td} font-mono text-xs`}>{values}</td>
                  <td className={`${td} font-mono text-xs`}>{fallback === "style" ? t("byStyle") : fallback === "embedding" ? t("embedding") : fallback}</td>
                  <td className={td}>{t(`options.${name}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="guide-messages" className="flex flex-col gap-2">
        <div>
          <h2 id="guide-messages" className="text-lg font-semibold">
            {t("messagesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("messagesIntro")}</p>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="rounded-xl border bg-card p-3">
            <dt className="font-mono text-xs font-medium">{`{ "type": "tilawah:resize", "height": 640 }`}</dt>
            <dd className="text-muted-foreground">{t("resizeMessage")}</dd>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <dt className="font-mono text-xs font-medium">{`{ "type": "tilawah:open", "url": "${origin}/…" }`}</dt>
            <dd className="text-muted-foreground">{t("openMessage")}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="guide-counting" className="flex flex-col gap-1">
        <h2 id="guide-counting" className="text-lg font-semibold">
          {t("countingTitle")}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("countingBody")}</p>
      </section>
    </div>
  );
}
