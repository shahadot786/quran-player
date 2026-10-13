import { authToken } from "./key";
import { mergeSnapshots, sameSnapshot } from "./merge";
import { isSyncSnapshot } from "./snapshot";
import type { SyncSnapshot } from "./types";

export type SyncErrorCode = "offline" | "invalid-key" | "rate-limited" | "too-large" | "rejected" | "not-configured" | "not-found" | "code-taken" | "conflict" | "server";

export class SyncError extends Error {
  constructor(
    readonly code: SyncErrorCode,
    readonly retryAfter?: number,
  ) {
    super(code);
  }
}

export type RemoteCopy = { version: number; snapshot: unknown };
export type PutResult = { ok: true; version: number } | { ok: false; version: number; snapshot: unknown };

export type SyncApi = {
  /** Null when the key has no cloud copy. */
  get: (key: string) => Promise<RemoteCopy | null>;
  put: (key: string, baseVersion: number, snapshot: SyncSnapshot) => Promise<PutResult>;
  remove: (key: string) => Promise<void>;
};

export type LocalData = { read: () => SyncSnapshot; write: (snapshot: SyncSnapshot) => void };

export type SyncOutcome = { version: number; uploaded: boolean };

const MAX_ATTEMPTS = 3;

const checked = (snapshot: unknown): SyncSnapshot => {
  if (!isSyncSnapshot(snapshot)) throw new SyncError("server");
  return snapshot;
};

type Remote = { version: number; snapshot: SyncSnapshot | null };

const toRemote = (copy: RemoteCopy | null): Remote => (copy ? { version: copy.version, snapshot: checked(copy.snapshot) } : { version: 0, snapshot: null });

/** Pull, merge, push: whatever the cloud has is folded into this device's data and the result is saved in both places. */
export async function runSync({
  api,
  key,
  local,
  requireRemote = false,
}: {
  api: SyncApi;
  key: string;
  local: LocalData;
  /** For restoring: a key with nothing behind it is an error instead of a first upload. */
  requireRemote?: boolean;
}): Promise<SyncOutcome> {
  let remote = toRemote(await api.get(key));
  if (requireRemote && !remote.snapshot) throw new SyncError("not-found");

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const before = local.read();
    const merged = remote.snapshot ? mergeSnapshots(before, remote.snapshot) : before;
    if (!sameSnapshot(before, merged)) local.write(merged);
    if (remote.snapshot && sameSnapshot(merged, remote.snapshot)) return { version: remote.version, uploaded: false };

    const result = await api.put(key, remote.version, merged);
    if (result.ok) return { version: result.version, uploaded: true };
    remote = result.snapshot === null ? { version: 0, snapshot: null } : { version: result.version, snapshot: checked(result.snapshot) };
  }
  throw new SyncError("conflict");
}

const STATUS_CODES: Record<number, SyncErrorCode> = { 401: "invalid-key", 404: "not-found", 413: "too-large", 422: "rejected", 429: "rate-limited", 503: "not-configured" };

function toError(response: Response): SyncError {
  const retryAfter = Number(response.headers.get("Retry-After"));
  return new SyncError(STATUS_CODES[response.status] ?? "server", Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
}

async function request(key: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch("/api/sync", {
      ...init,
      cache: "no-store",
      headers: { Authorization: `Bearer ${await authToken(key)}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch {
    throw new SyncError("offline");
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    throw new SyncError("server");
  }
}

export const httpApi: SyncApi = {
  async get(key) {
    const response = await request(key, { method: "GET" });
    if (response.status === 404) return null;
    if (!response.ok) throw toError(response);
    const body = await readJson(response);
    return { version: Number(body.version), snapshot: body.snapshot };
  },
  async put(key, baseVersion, snapshot) {
    const response = await request(key, { method: "PUT", body: JSON.stringify({ baseVersion, snapshot }) });
    if (response.status === 409) {
      const body = await readJson(response);
      return { ok: false, version: Number(body.version) || 0, snapshot: body.snapshot ?? null };
    }
    if (!response.ok) throw toError(response);
    return { ok: true, version: Number((await readJson(response)).version) };
  },
  async remove(key) {
    const response = await request(key, { method: "DELETE" });
    if (!response.ok) throw toError(response);
  },
};
