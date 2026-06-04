import type { WSContext } from 'hono/ws';
import type {
  ChangeType,
  EntityType,
  SocketEvent,
} from '@draw-steel/shared';

/**
 * Tracks WebSocket connections per campaign id and broadcasts entity-change
 * events to every watcher, reproducing the original Ktor `SocketService` and
 * its `CampaignSocketUpdate` payload.
 */
class SocketService {
  private readonly connections = new Map<number, Set<WSContext>>();

  add(campaignId: number, ws: WSContext): void {
    let set = this.connections.get(campaignId);
    if (!set) {
      set = new Set();
      this.connections.set(campaignId, set);
    }
    set.add(ws);
  }

  remove(campaignId: number, ws: WSContext): void {
    const set = this.connections.get(campaignId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      this.connections.delete(campaignId);
    }
  }

  broadcast(update: SocketEvent): void {
    const set = this.connections.get(update.campaignId);
    if (!set || set.size === 0) return;

    const payload = JSON.stringify(update);
    for (const ws of set) {
      try {
        ws.send(payload);
      } catch {
        // Drop sockets that fail to receive; they'll be cleaned up on close.
      }
    }
  }
}

export const socketService = new SocketService();

/** Build + broadcast a campaign-scoped change event. */
export function emit(
  campaignId: number,
  changeType: ChangeType,
  entityType: EntityType,
  dataId: number | null,
  data: SocketEvent['data'],
): void {
  socketService.broadcast({
    campaignId,
    changeType,
    entityType,
    dataId,
    data,
  });
}
