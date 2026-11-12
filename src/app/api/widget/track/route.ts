import { handleTrack } from "@/lib/widget/server/handler";
import { widgetDeps } from "@/lib/widget/server/deps";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => handleTrack(request, widgetDeps());
