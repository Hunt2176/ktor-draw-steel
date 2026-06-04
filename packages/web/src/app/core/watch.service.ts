import { Injectable, inject } from '@angular/core';
import { SocketEventSchema, type SocketEvent } from '@draw-steel/shared';
import { ConnectionStatusService, type ConnectionStatus } from './connection-status.service';

/**
 * Aggregate connection status surfaced to the UI across all watched sockets.
 * Re-exported from {@link ConnectionStatusService} for backward compatibility;
 * that service is now the source of truth for the status signals.
 */
export type WatchStatus = ConnectionStatus;

/** Maximum reconnect attempts per socket before a campaign is considered offline. */
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Maintains one WebSocket per watched campaign (`/watch/{id}`), parses incoming
 * change events with the shared zod schema, and forwards valid events to a
 * single handler. Mirrors the original `useWatchCampaign` hook (reconnecting,
 * validated socket consumption) — zod replaces the original arktype validation.
 *
 * Writes aggregate connection state (status + reconnect attempts) to the
 * zero-dependency {@link ConnectionStatusService}, which the UI reads from. This
 * keeps the zod-importing WatchService out of any eager bundle. Status tracking
 * is purely additive — the socket map, reconnect/backoff, zod parsing, and
 * handler dispatch are unchanged.
 */
@Injectable({ providedIn: 'root' })
export class WatchService {
  private readonly sockets = new Map<number, WebSocket>();
  private readonly attempts = new Map<number, number>();
  private handler?: (event: SocketEvent) => void;

  /** Per-socket lifecycle state, used to derive the aggregate `status`. */
  private readonly states = new Map<number, WatchStatus>();

  /** Source of truth for the UI-facing connection status signals. */
  private readonly connectionStatus = inject(ConnectionStatusService);

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

    // attempts>0 means this open() call is a backoff-driven retry.
    const isRetry = (this.attempts.get(campaignId) ?? 0) > 0;
    this.states.set(campaignId, isRetry ? 'reconnecting' : 'connecting');
    this.recomputeStatus();

    socket.onopen = () => {
      this.attempts.set(campaignId, 0);
      this.states.set(campaignId, 'live');
      this.recomputeStatus();
    };

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
      if (tries < MAX_RECONNECT_ATTEMPTS) {
        this.attempts.set(campaignId, tries + 1);
        // Retry pending: keep this campaign in a reconnecting state across the
        // backoff window even though its socket has been removed from the map.
        this.states.set(campaignId, 'reconnecting');
        setTimeout(() => this.open(campaignId), 1000 * (tries + 1));
      } else {
        // Retries exhausted — this campaign is offline; drop its state so the
        // aggregate reflects the remaining sockets (or 'idle' if none remain).
        this.states.set(campaignId, 'offline');
      }
      this.recomputeStatus();
    };

    socket.onerror = () => socket.close();
  }

  /**
   * Derives the aggregate `status` and `reconnectAttempts` from the per-campaign
   * lifecycle states and writes them to {@link ConnectionStatusService}.
   * Precedence: any live → 'live'; else any connecting/reconnecting → that; else
   * offline if any campaign is tracked; else 'idle' when nothing is (or has
   * been) watched.
   */
  private recomputeStatus(): void {
    const states = [...this.states.values()];

    let next: WatchStatus;
    if (states.length === 0) {
      next = 'idle';
    } else if (states.includes('live')) {
      next = 'live';
    } else if (states.includes('reconnecting')) {
      next = 'reconnecting';
    } else if (states.includes('connecting')) {
      next = 'connecting';
    } else {
      next = 'offline';
    }

    this.connectionStatus.update({
      status: next,
      attempts: Math.max(0, ...this.attempts.values()),
    });
  }
}
