import { loadConfig } from "./config";
import { createApp } from "./app";
import { serve } from "@hono/node-server";

const config = loadConfig();
const { app, injectWebSocket } = createApp(config);

console.log(`Starting Hono backend on port ${config.port}`);

const server = serve({
    fetch: app.fetch,
    port: config.port,
});

injectWebSocket(server);
