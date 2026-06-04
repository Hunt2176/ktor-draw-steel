import type { WSContext } from 'hono/ws';
import { eq } from 'drizzle-orm';
import type { SocketEvent } from '@draw-steel/shared';
import { db } from '../db/client.js';
import { campaigns } from '../db/schema.js';
import { broadcaster, type ChangeEvent } from '../events/broadcaster.js';

/**
 * Tracks WebSocket connections keyed by campaign id and relays change events to
 * the relevant watchers. Mirrors the original Kotlin `SocketService`.
 */
class SocketService {
  private readonly connections = new Map<number, Set<WSContext>>();

  constructor() {
    broadcaster.subscribe((event) => this.onChange(event));
  }

  /** Returns true if the campaign exists and the socket was registered. */
  addConnection(campaignId: number, socket: WSContext): boolean {
    const campaign = db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .get();

    if (!campaign) return false;

    let set = this.connections.get(campaignId);
    if (!set) {
      set = new Set();
      this.connections.set(campaignId, set);
    }
    set.add(socket);
    return true;
  }

  removeConnection(campaignId: number, socket: WSContext): void {
    const set = this.connections.get(campaignId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.connections.delete(campaignId);
  }

  private onChange(event: ChangeEvent): void {
    const sockets = this.connections.get(event.campaignId);
    if (!sockets || sockets.size === 0) return;

    const payload: SocketEvent = {
      changeType: event.changeType,
      campaignId: event.campaignId,
      entityType: event.entityType,
      dataId: event.dataId,
      data: event.data,
    };
    const message = JSON.stringify(payload);

    for (const socket of [...sockets]) {
      try {
        socket.send(message);
      } catch (err) {
        console.error('Failed to send socket update', err);
      }
    }
  }
}

export const socketService = new SocketService();
