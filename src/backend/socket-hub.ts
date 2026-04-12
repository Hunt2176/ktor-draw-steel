import type { ChangeType, SocketUpdate } from "./types";
import { campaignIdForEntity, entityTypeByTable, socketDataForEntity } from "./data/socket-data";

export type CampaignSocket = {
    send: (payload: string) => void;
};

const activeConnections = new Map<number, Set<CampaignSocket>>();

function removeSocket(campaignId: number, socket: CampaignSocket): void {
    const bucket = activeConnections.get(campaignId);
    if (bucket == null) {
        return;
    }

    bucket.delete(socket);
    if (bucket.size === 0) {
        activeConnections.delete(campaignId);
    }
}

function sendSocketUpdate(update: SocketUpdate): void {
    const sockets = activeConnections.get(update.campaignId);
    if (sockets == null || sockets.size === 0) {
        return;
    }

    const payload = JSON.stringify(update);

    for (const socket of [...sockets]) {
        try {
            socket.send(payload);
        } catch {
            removeSocket(update.campaignId, socket);
        }
    }
}

export function emitEntityChange(changeType: ChangeType, table: string, id: number, campaignIdOverride?: number): void {
    const entityType = entityTypeByTable[table] ?? null;
    if (entityType == null) {
        return;
    }

    const campaignId = campaignIdOverride ?? campaignIdForEntity(table, id);
    if (campaignId == null) {
        return;
    }

    const data = changeType === "Removed" ? null : socketDataForEntity(table, id);

    sendSocketUpdate({
        changeType,
        campaignId,
        entityType,
        dataId: id,
        data,
    });
}

export function trackSocket(campaignId: number, socket: CampaignSocket): void {
    const set = activeConnections.get(campaignId) ?? new Set<CampaignSocket>();
    set.add(socket);
    activeConnections.set(campaignId, set);
}

export function untrackSocket(campaignId: number, socket: CampaignSocket): void {
    removeSocket(campaignId, socket);
}
