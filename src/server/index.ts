import { websocketHandlers, type SocketData } from "./core/socket.js";
import { createRequestRouter } from "./routes/index.js";

const port = Number.parseInt(Bun.env.PORT ?? "8080", 10);

const requestRouter = createRequestRouter();

const server = Bun.serve<SocketData>({
    port,
    idleTimeout: 60,
    fetch(req, serverInstance) {
        return requestRouter.handle(req, serverInstance);
    },
    websocket: websocketHandlers,
});

console.log(`Bun + Drizzle backend listening on http://localhost:${server.port}`);
