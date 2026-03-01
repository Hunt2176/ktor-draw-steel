import { responseText } from "../core/http.js";
import { RequestRouter } from "../core/router.js";
import { handleFiles } from "../features/files.js";

export function registerFilesRoutes(router: RequestRouter): void {
    router.routeAll("/files/*", async (ctx) => {
        const response = await handleFiles(ctx.req, ctx.pathname);
        return response ?? responseText("Not found", 404);
    });
}
