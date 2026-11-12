"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Segmented } from "./segmented";

type Device = "phone" | "tablet" | "wide";

const FRAME = { phone: "max-w-sm", tablet: "max-w-3xl", wide: "max-w-none" } as const;
const MIN_HEIGHT = 160;

export function Preview({
  src,
  title,
  help,
  deviceLabel,
  devices,
  openLabel,
}: {
  src: string;
  title: string;
  help: string;
  deviceLabel: string;
  devices: readonly { value: Device; label: string }[];
  openLabel: string;
}) {
  const [device, setDevice] = useState<Device>("phone");
  const [height, setHeight] = useState(640);
  const [shown, setShown] = useState(src);
  const frame = useRef<HTMLIFrameElement>(null);

  // Typing a colour changes the address on every key, so the frame follows after a short pause.
  useEffect(() => {
    const timer = setTimeout(() => setShown(src), 300);
    return () => clearTimeout(timer);
  }, [src]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: string; height?: unknown } | null;
      if (data?.type === "tilawah:resize" && typeof data.height === "number") setHeight(Math.max(MIN_HEIGHT, Math.ceil(data.height)));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <section aria-labelledby="preview-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="preview-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{help}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={shown} target="_blank" rel="noopener">
            {openLabel}
            <ExternalLinkIcon aria-hidden />
          </a>
        </Button>
      </div>
      <Segmented label={deviceLabel} value={device} options={devices} onChange={setDevice} />
      <div className="rounded-xl border bg-muted/50 p-3">
        <iframe
          ref={frame}
          key={shown}
          src={shown}
          title={title}
          allow="autoplay; encrypted-media"
          style={{ height }}
          className={cn("mx-auto block w-full overflow-hidden rounded-xl border bg-background", FRAME[device])}
        />
      </div>
    </section>
  );
}
