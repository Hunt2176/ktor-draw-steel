import type { ChangeType, EntityType, SocketEvent } from '@draw-steel/shared';

/**
 * In-process change bus. Repositories publish an entity change here after every
 * mutation; the SocketService relays matching changes to campaign watchers.
 *
 * This replaces the original Exposed `EntityHook.subscribe` global hook — same
 * effect (every create/update/delete fans out to interested WebSocket clients),
 * expressed explicitly at the mutation sites.
 */
export interface ChangeEvent {
  entityType: EntityType;
  campaignId: number;
  dataId: number | null;
  data: SocketEvent['data'];
  changeType: ChangeType;
}

type Listener = (event: ChangeEvent) => void;

class Broadcaster {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: ChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Broadcaster listener failed', err);
      }
    }
  }
}

export const broadcaster = new Broadcaster();
