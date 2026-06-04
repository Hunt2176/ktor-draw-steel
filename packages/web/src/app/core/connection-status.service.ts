import { Injectable, signal } from '@angular/core';

/**
 * Aggregate live-connection status surfaced to the UI across all watched
 * sockets. Identical value set to the original `WatchService.WatchStatus`.
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline';

/**
 * Zero-dependency holder for the aggregate connection status and reconnect
 * attempt count. Deliberately imports nothing from `@draw-steel/shared` or zod
 * so eagerly-rendered UI (e.g. the header indicator) can read connection state
 * without pulling the shared schema graph into the first-load bundle.
 *
 * `WatchService` (lazy, zod-importing) is the sole writer; UI components are
 * read-only consumers of the exposed signals.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionStatusService {
  private readonly _status = signal<ConnectionStatus>('idle');
  private readonly _reconnectAttempts = signal(0);

  /** Aggregate connection status across every watched campaign. */
  readonly status = this._status.asReadonly();

  /** Highest current reconnect attempt count across watched sockets. */
  readonly reconnectAttempts = this._reconnectAttempts.asReadonly();

  /** Set the aggregate connection status. */
  setStatus(status: ConnectionStatus): void {
    this._status.set(status);
  }

  /** Set the aggregate reconnect attempt count. */
  setAttempts(attempts: number): void {
    this._reconnectAttempts.set(attempts);
  }

  /** Set both signals in one call, mirroring a single lifecycle recompute. */
  update(next: { status: ConnectionStatus; attempts: number }): void {
    this._status.set(next.status);
    this._reconnectAttempts.set(next.attempts);
  }
}
