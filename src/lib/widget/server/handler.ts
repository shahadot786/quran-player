import { timingSafeEqual } from "node:crypto";
import { normalizeHost } from "@/lib/embed/options";
import { hashKey } from "@/lib/sync/key";
import { bearer, readLimited, reply } from "@/lib/sync/server/handler";
import { checkLimits, LIMITS } from "@/lib/sync/server/rate-limit";
import { WIDGET_EVENTS, type WidgetEvent, type WidgetStore } from "./store";

export const MAX_TRACK_BYTES = 1024;
export const UNKNOWN_HOST = "unknown";
const VISITOR_DAYS = 2;

export type WidgetDeps = { store: WidgetStore | null; now: () => Date; salt: string; secret: string; siteOrigin: string };

const isEvent = (value: unknown): value is WidgetEvent => WIDGET_EVENTS.some((event) => event === value);

// Only a salted hash of address, browser and day is kept, so a visitor can be counted once without being identified.
async function visitorHash(request: Request, salt: string, day: string) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return hashKey(`${salt}:${day}:${address}:${request.headers.get("user-agent") ?? ""}`);
}

/** Stops other web pages from posting counts on a visitor's behalf; it is not a login, so the rate limit does the rest. */
function fromOtherSite(request: Request, siteOrigin: string) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin !== new URL(request.url).origin && origin !== siteOrigin;
}

export async function handleTrack(request: Request, deps: WidgetDeps): Promise<Response> {
  // Answered quietly, so a host's console shows no error while counting is off.
  if (!deps.store || !deps.salt) return reply(204, undefined, { "X-Counting": "off" });
  if (fromOtherSite(request, deps.siteOrigin)) return reply(403, { error: "forbidden" });

  const text = await readLimited(request, MAX_TRACK_BYTES);
  if (text === null) return reply(413, { error: "too-large" });
  let body: { event?: unknown; host?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, { error: "invalid" });
  }
  if (typeof body !== "object" || body === null || !isEvent(body.event)) return reply(400, { error: "invalid" });
  const host = normalizeHost(typeof body.host === "string" ? body.host : undefined) ?? UNKNOWN_HOST;

  try {
    const now = deps.now();
    const day = now.toISOString().slice(0, 10);
    const visitor = await visitorHash(request, deps.salt, day);
    const wait = await checkLimits(deps.store, [{ bucket: `widget:${visitor}`, max: LIMITS.anyPerIp, window: "hour" }], now);
    if (wait !== null) return reply(429, { error: "rate-limited" }, { "Retry-After": String(wait) });
    await deps.store.record(day, host, body.event, visitor);
    return reply(204);
  } catch {
    return reply(500, { error: "server" });
  }
}

export async function handleWidgetCleanup(request: Request, deps: WidgetDeps): Promise<Response> {
  const given = Buffer.from(bearer(request) ?? "");
  const expected = Buffer.from(deps.secret);
  if (!deps.secret || given.length !== expected.length || !timingSafeEqual(given, expected)) return reply(401, { error: "unauthorized" });
  if (!deps.store) return reply(503, { error: "not-configured" });
  try {
    const cutoff = new Date(deps.now().getTime() - VISITOR_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return reply(200, { visitorsDeleted: await deps.store.purgeVisitors(cutoff) });
  } catch {
    return reply(500, { error: "server" });
  }
}
