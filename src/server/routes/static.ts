import { RequestRouter } from "../core/router.js";
import { serveStatic } from "../features/static.js";

export function registerStaticRoutes(router: RequestRouter): void {
    router.routeAll("/*", (ctx) => serveStatic(ctx.pathname));
}
