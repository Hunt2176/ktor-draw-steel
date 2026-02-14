import { responseText } from "../core/http.js";
import { RequestRouter } from "../core/router.js";
import { tryUpgradeWatchSocket, type SocketData } from "../core/socket.js";

export function registerWatchRoute(router: RequestRouter): void {
    router.route("GET", /^\/watch(?:\/campaign)?\/(\d+)$/, (ctx) => {
        if (!ctx.server) {
            return responseText("Server instance unavailable", 500);
        }

        return tryUpgradeWatchSocket(ctx.req, ctx.server as Bun.Server<SocketData>)
            ?? responseText("WebSocket upgrade failed", 500);
    });
}
