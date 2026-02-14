import { responseText } from "../core/http.js";
import { RequestRouter } from "../core/router.js";
import { handleKanka } from "../features/kanka.js";

export function registerKankaRoutes(router: RequestRouter): void {
    router.routeAll(/^\/kanka(?:\/.*)?$/, async (ctx) => {
        const response = await handleKanka(ctx.req, ctx.pathname, ctx.url.search);
        return response ?? responseText("Not found", 404);
    });
}
