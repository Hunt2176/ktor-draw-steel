import { eq } from "drizzle-orm";
import { campaigns, db } from "../db.js";
import { parseId, responseText } from "./http.js";

export type ChangeType = "Created" | "Updated" | "Removed";
export type EntityType =
    | "ExposedInventoryItem"
    | "ExposedDisplayEntry"
    | "ExposedCampaign"
    | "ExposedCharacter"
    | "ExposedCombat"
    | "ExposedCombatant"
    | "ExposedCondition"
    | "ExposedCharacterCondition";

export type SocketEvent = {
    campaignId: number;
    changeType: ChangeType;
    entityType: EntityType | null;
    dataId: number | null;
    data: unknown | null;
};

export type SocketData = {
    campaignId: number;
};

const watchers = new Map<number, Set<Bun.ServerWebSocket<SocketData>>>();

export function notifyCampaign(
    campaignId: number,
    changeType: ChangeType,
    entityType: EntityType | null,
    dataId: number | null,
    data: unknown | null,
) {
    const sockets = watchers.get(campaignId);
    if (!sockets || sockets.size === 0) {
        return;
    }

    const payload: SocketEvent = {
        campaignId,
        changeType,
        entityType,
        dataId,
        data,
    };

    const message = JSON.stringify(payload);
    for (const socket of sockets) {
        socket.send(message);
    }
}

export function tryUpgradeWatchSocket(req: Request, serverInstance: Bun.Server<SocketData>): Response | null {
    const url = new URL(req.url);
    const websocketMatch = url.pathname.match(/^\/watch(?:\/campaign)?\/(\d+)$/);
    if (!websocketMatch) {
        return null;
    }

    const id = parseId(websocketMatch[1]);
    if (id instanceof Response) {
        return id;
    }

    const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
    if (!campaign) {
        return responseText(`Campaign ${id} not found`, 404);
    }

    if (serverInstance.upgrade(req, { data: { campaignId: id } })) {
        return new Response();
    }

    return responseText("WebSocket upgrade failed", 500);
}

export const websocketHandlers: Bun.WebSocketHandler<SocketData> = {
    open(socket) {
        const campaignId = socket.data.campaignId;
        const set = watchers.get(campaignId) ?? new Set();
        set.add(socket);
        watchers.set(campaignId, set);
    },
    message() {
        // Server only pushes updates; incoming messages are ignored.
    },
    close(socket) {
        const campaignId = socket.data.campaignId;
        const set = watchers.get(campaignId);
        if (!set) {
            return;
        }

        set.delete(socket);
        if (set.size === 0) {
            watchers.delete(campaignId);
        }
    },
};
