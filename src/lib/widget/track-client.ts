import type { WidgetEvent } from "./server/store";

const ENDPOINT = "/api/widget/track";

/** Fire and forget: counting must never slow down or break the widget, so every failure is swallowed. */
export function trackWidget(event: WidgetEvent, host: string | null) {
  try {
    const body = JSON.stringify({ event, host });
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
  } catch {
    // nothing to do
  }
}
