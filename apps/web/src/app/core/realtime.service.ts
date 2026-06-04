import { Injectable, OnDestroy, signal } from '@angular/core';
import { SocketEventSchema } from '@draw-steel/shared';

/**
 * Owns a WebSocket connection to `/watch/:campaignId` and exposes a `revision`
 * signal that bumps on every change event for the watched campaign. Resources
 * that include `revision()` in their params auto-reload, reproducing the
 * original `useWatchCampaign` query-invalidation behaviour.
 *
 * Provided per page component so the socket is torn down on navigation.
 */
@Injectable()
export class RealtimeService implements OnDestroy {
  readonly revision = signal(0);

  private socket?: WebSocket;
  private currentId: number | null = null;

  watch(id: number | undefined): void {
    if (id == null || Number.isNaN(id)) {
      this.close();
      return;
    }
    if (this.currentId === id) return;

    this.close();
    this.currentId = id;

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/watch/${id}`);
    ws.onmessage = (event) => {
      try {
        const parsed = SocketEventSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) {
          console.error(parsed.error.message);
          return;
        }
      } catch {
        // Non-JSON frame; still treat as a generic invalidation signal.
      }
      this.revision.update((v) => v + 1);
    };
    ws.onclose = () => {
      if (this.socket === ws) {
        this.socket = undefined;
        this.currentId = null;
      }
    };
    this.socket = ws;
  }

  private close(): void {
    this.socket?.close();
    this.socket = undefined;
    this.currentId = null;
  }

  ngOnDestroy(): void {
    this.close();
  }
}
