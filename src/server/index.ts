import { handleApi } from "./features/api.js";
import { handleFiles } from "./features/files.js";
import { handleKanka } from "./features/kanka.js";
import { serveStatic } from "./features/static.js";
import { websocketHandlers, tryUpgradeWatchSocket, type SocketData } from "./core/socket.js";

const port = Number.parseInt(Bun.env.PORT ?? "8080", 10);

const server = Bun.serve<SocketData>({
    port,
    idleTimeout: 60,
    fetch(req, serverInstance) {
        const socketUpgrade = tryUpgradeWatchSocket(req, serverInstance);
        if (socketUpgrade) {
            return socketUpgrade;
        }

        return (async () => {
            const url = new URL(req.url);
            const pathname = url.pathname;

            const filesResponse = await handleFiles(req, pathname);
            if (filesResponse) {
                return filesResponse;
            }

            const kankaResponse = await handleKanka(req, pathname, url.search);
            if (kankaResponse) {
                return kankaResponse;
            }

            const apiResponse = await handleApi(req, pathname);
            if (apiResponse) {
                return apiResponse;
            }

            return serveStatic(pathname);
        })();
    },
    websocket: websocketHandlers,
});

console.log(`Bun + Drizzle backend listening on http://localhost:${server.port}`);
