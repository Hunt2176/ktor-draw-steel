import { Injectable, signal } from '@angular/core';
import { SocketEventSchema, type SocketEvent } from '@draw-steel/shared';

/** Aggregate connection status surfaced to the UI across all watched sockets. */
export type WatchStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline';

/** Maximum reconnect attempts per socket before a campaign is considered offline. */
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Maintains one WebSocket per watched campaign (`/watch/{id}`), parses incoming
 * change events with the shared zod schema, and forwards valid events to a
 * single handler. Mirrors the original `useWatchCampaign` hook (reconnecting,
 * validated socket consumption) — zod replaces the original arktype validation.
 *
 * Also tracks a public, read-only connection `status` signal (aggregated across
 * all watched sockets) and a `reconnectAttempts` signal, for surfacing live
 * connection state in the UI. Status tracking is purely additive — the socket
 * map, reconnect/backoff, zod parsing, and handler dispatch are unchanged.
 */
@Injectable({ providedIn: 'root' })
export class WatchService {
  private readonly sockets = new Map<number, WebSocket>();
  private readonly attempts = new Map<number, number>();
  private handler?: (event: SocketEvent) => void;

  /** Per-socket lifecycle state, used to derive the aggregate `status`. */
  private readonly states = new Map<number, WatchStatus>();

  private readonly _status = signal<WatchStatus>('idle');
  private readonly _reconnectAttempts = signal(0);

  /** Aggregate connection status across every watched campaign. */
  readonly status = this._status.asReadonly();

  /** Highest current reconnect attempt count across watched sockets. */
  readonly reconnectAttempts = this._reconnectAttempts.asReadonly();

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
   * Derives the public aggregate `status` and `reconnectAttempts` signals from
   * the per-campaign lifecycle states. Precedence: any live → 'live'; else any
   * connecting/reconnecting → that; else offline if any campaign is tracked;
   * else 'idle' when nothing is (or has been) watched.
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

    this._status.set(next);
    this._reconnectAttempts.set(Math.max(0, ...this.attempts.values()));
  }
}
