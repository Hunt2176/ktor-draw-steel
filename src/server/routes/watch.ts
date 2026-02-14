import { responseText } from "../core/http.js";
import { RequestRouter, type RequestRouterContext } from "../core/router.js";
import { tryUpgradeWatchSocket, type SocketData } from "../core/socket.js";

export function registerWatchRoute(router: RequestRouter): void {
    const watchHandler = (ctx: RequestRouterContext): Response => {
        if (!ctx.server) {
            return responseText("Server instance unavailable", 500);
        }

        return tryUpgradeWatchSocket(ctx.req, ctx.server as Bun.Server<SocketData>)
            ?? responseText("WebSocket upgrade failed", 500);
    };

    router.route("GET", "/watch/:id", watchHandler);
    router.route("GET", "/watch/campaign/:id", watchHandler);
}
