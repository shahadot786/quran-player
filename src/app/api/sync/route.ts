import { handleSync } from "@/lib/sync/server/handler";
import { syncDeps } from "@/lib/sync/server/deps";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleSync(request, "GET", syncDeps());
export const PUT = (request: Request) => handleSync(request, "PUT", syncDeps());
export const DELETE = (request: Request) => handleSync(request, "DELETE", syncDeps());
