import type { BrowserContext } from "@playwright/test";

type Remote = { version: number; snapshot: unknown };

// Stands in for /api/sync so these tests need no database; it keeps a version per key like the real endpoints.
export function fakeCloud() {
  const records = new Map<string, Remote>();
  const calls: string[] = [];
  let failWith: number | "abort" | null = null;
  return {
    records,
    calls,
    fail: (status: number | "abort" | null) => (failWith = status),
    async attach(context: BrowserContext) {
      await context.route("**/api/sync", async (route) => {
        const request = route.request();
        const key = (request.headers()["authorization"] ?? "").replace("Bearer ", "");
        calls.push(request.method());
        if (failWith === "abort") return route.abort("failed");
        if (failWith) return route.fulfill({ status: failWith, headers: { "Retry-After": "60" }, json: {} });
        const record = records.get(key);
        if (request.method() === "GET") return record ? route.fulfill({ json: record }) : route.fulfill({ status: 404, json: {} });
        if (request.method() === "DELETE") {
          records.delete(key);
          return route.fulfill({ status: 204 });
        }
        const body = request.postDataJSON() as { baseVersion: number; snapshot: unknown };
        if ((record?.version ?? 0) !== body.baseVersion) return route.fulfill({ status: 409, json: record ?? { version: 0, snapshot: null } });
        const version = body.baseVersion + 1;
        records.set(key, { version, snapshot: body.snapshot });
        return route.fulfill({ json: { version } });
      });
    },
  };
}
