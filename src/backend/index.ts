import { loadConfig } from "./config";
import { createApp } from "./app";

const config = loadConfig();
const { app, websocket } = createApp(config);

console.log(`Starting Hono backend on port ${config.port}`);

Bun.serve({
    fetch: app.fetch,
    port: config.port,
    websocket,
});
