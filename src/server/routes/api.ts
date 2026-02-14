import { responseText } from "../core/http.js";
import { RequestRouter } from "../core/router.js";
import { handleApi } from "../features/api/index.js";

export function registerApiRoutes(router: RequestRouter): void {
    router.routeAll(/^\/api(?:\/.*)?$/, async (ctx) => {
        const response = await handleApi(ctx.req, ctx.pathname);
        return response ?? responseText("Not found", 404);
    });
}
