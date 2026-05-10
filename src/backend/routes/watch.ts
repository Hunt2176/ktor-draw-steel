import { Hono } from "hono";
import type { createNodeWebSocket } from "@hono/node-ws";
import { getCampaignDtoById } from "../data/readers";
import { trackSocket, untrackSocket, type CampaignSocket } from "../socket-hub";

type UpgradeWebSocket = ReturnType<typeof createNodeWebSocket>["upgradeWebSocket"];

function registerWatchRoute(app: Hono, route: "/watch/:id" | "/watch/campaign/:id", upgradeWebSocket: UpgradeWebSocket) {
    app.get(
        route,
        upgradeWebSocket((c) => {
            const campaignId = Number.parseInt(c.req.param("id") ?? "", 10);

            return {
                onOpen(_event, socket) {
                    if (Number.isNaN(campaignId)) {
                        socket.close(1008, "The id of the entity is invalid");
                        return;
                    }

                    if (getCampaignDtoById(campaignId) == null) {
                        socket.close(1008, `Campaign ${campaignId} not found.`);
                        return;
                    }

                    trackSocket(campaignId, socket as CampaignSocket);
                },
                onClose(_event, socket) {
                    if (Number.isNaN(campaignId)) {
                        return;
                    }

                    untrackSocket(campaignId, socket as CampaignSocket);
                },
            };
        }),
    );
}

export function registerWatchRoutes(app: Hono, upgradeWebSocket: UpgradeWebSocket): void {
    registerWatchRoute(app, "/watch/:id", upgradeWebSocket);
    registerWatchRoute(app, "/watch/campaign/:id", upgradeWebSocket);
}
