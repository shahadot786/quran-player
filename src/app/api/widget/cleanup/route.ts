import { handleWidgetCleanup } from "@/lib/widget/server/handler";
import { widgetDeps } from "@/lib/widget/server/deps";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleWidgetCleanup(request, widgetDeps());
