import { Injectable } from '@angular/core';
import { SocketEventSchema, type SocketEvent } from '@draw-steel/shared';

/**
 * Maintains one WebSocket per watched campaign (`/watch/{id}`), parses incoming
 * change events with the shared zod schema, and forwards valid events to a
 * single handler. Mirrors the original `useWatchCampaign` hook (reconnecting,
 * validated socket consumption) — zod replaces the original arktype validation.
 */
@Injectable({ providedIn: 'root' })
export class WatchService {
  private readonly sockets = new Map<number, WebSocket>();
  private readonly attempts = new Map<number, number>();
  private handler?: (event: SocketEvent) => void;

  setHandler(handler: (event: SocketEvent) => void): void {
    this.handler = handler;
  }

  watch(campaignId: number | undefined): void {
    if (campaignId == null || Number.isNaN(campaignId)) return;
    if (this.sockets.has(campaignId)) return;
    this.open(campaignId);
  }

  private open(campaignId: number): void {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${location.host}/watch/${campaignId}`);
    this.sockets.set(campaignId, socket);

    socket.onopen = () => this.attempts.set(campaignId, 0);

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const parsed = SocketEventSchema.safeParse(JSON.parse(event.data));
        if (parsed.success) {
          this.handler?.(parsed.data);
        } else {
          console.error(parsed.error.message);
        }
      } catch (err) {
        console.error(err);
      }
    };

    socket.onclose = () => {
      this.sockets.delete(campaignId);
      const tries = this.attempts.get(campaignId) ?? 0;
      if (tries < 5) {
        this.attempts.set(campaignId, tries + 1);
        setTimeout(() => this.open(campaignId), 1000 * (tries + 1));
      }
    };

    socket.onerror = () => socket.close();
  }
}
