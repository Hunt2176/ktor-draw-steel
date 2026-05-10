import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { AppConfig } from "./types";
import { createApiRouter } from "./routes/api";
import { registerFileRoutes } from "./routes/files";
import { registerKankaRoutes } from "./routes/kanka";
import { registerWatchRoutes } from "./routes/watch";
import { registerStaticRoutes } from "./routes/static";

export function createApp(config: AppConfig) {
    const app = new Hono();
    const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

    app.use("*", async (c, next) => {
        await next();
        c.header("X-Engine", "Hono");
    });

    registerFileRoutes(app);
    registerKankaRoutes(app, config);
    registerWatchRoutes(app, upgradeWebSocket);

    app.route("/api", createApiRouter());
    registerStaticRoutes(app);

    app.onError((error, c) => {
        const statusCandidate = Number((error as { status?: number }).status ?? 500);
        const status = Number.isInteger(statusCandidate) && statusCandidate >= 100 && statusCandidate <= 599
            ? statusCandidate
            : 500;
        const message = error instanceof Error ? error.message : String(error);
        const wantsJson = c.req.header("accept")?.includes("application/json") === true;

        if (wantsJson) {
            return new Response(JSON.stringify({ error: message }), {
                status,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(`500: ${message}`, {
            status,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    });

    return { app, injectWebSocket };
}
