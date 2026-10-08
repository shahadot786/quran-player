import { handleCleanup } from "@/lib/sync/server/handler";
import { syncDeps } from "@/lib/sync/server/deps";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleCleanup(request, syncDeps());
