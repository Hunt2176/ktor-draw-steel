import { Injectable, inject, signal, untracked, type Signal, type WritableSignal } from '@angular/core';
import type { CampaignDetails, Character, Combat, SocketEvent } from '@draw-steel/shared';
import { ApiService } from './api.service';
import { WatchService } from './watch.service';

/**
 * Signal-based reactive cache + live-update coordinator. Fills the role the
 * original played with TanStack Query: components read cached signals, mutations
 * trigger refetches, and campaign WebSocket events invalidate the matching
 * campaign/combat/character entries.
 */
@Injectable({ providedIn: 'root' })
export class CampaignStore {
  private readonly api = inject(ApiService);
  private readonly watcher = inject(WatchService);

  private readonly listSig = signal<CampaignDetails[] | undefined>(undefined);
  private listLoaded = false;

  private readonly campaignSigs = new Map<number, WritableSignal<CampaignDetails | undefined>>();
  private readonly combatsSigs = new Map<number, WritableSignal<Combat[] | undefined>>();
  private readonly combatSigs = new Map<number, WritableSignal<Combat | undefined>>();
  private readonly characterSigs = new Map<number, WritableSignal<Character | undefined>>();

  constructor() {
    this.watcher.setHandler((event) => this.onSocketEvent(event));
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  campaignList(): Signal<CampaignDetails[] | undefined> {
    if (!this.listLoaded) {
      this.listLoaded = true;
      this.refetchList();
    }
    return this.listSig.asReadonly();
  }

  campaign(id: number): Signal<CampaignDetails | undefined> {
    let sig = this.campaignSigs.get(id);
    if (!sig) {
      sig = signal<CampaignDetails | undefined>(undefined);
      this.campaignSigs.set(id, sig);
      this.refetchCampaign(id);
    }
    // Establishing the live socket writes connection-status signals. Components
    // legitimately read campaign() from inside a computed, so run this side effect
    // outside the caller's reactive context to avoid NG0600 (writing a signal in a
    // computed). watch() is idempotent, so repeated calls during recomputes are cheap.
    untracked(() => this.watcher.watch(id));
    return sig.asReadonly();
  }

  combatsFor(campaignId: number): Signal<Combat[] | undefined> {
    let sig = this.combatsSigs.get(campaignId);
    if (!sig) {
      sig = signal<Combat[] | undefined>(undefined);
      this.combatsSigs.set(campaignId, sig);
      this.refetchCombats(campaignId);
    }
    return sig.asReadonly();
  }

  combat(id: number): Signal<Combat | undefined> {
    let sig = this.combatSigs.get(id);
    if (!sig) {
      sig = signal<Combat | undefined>(undefined);
      this.combatSigs.set(id, sig);
      this.refetchCombat(id);
    }
    return sig.asReadonly();
  }

  character(id: number): Signal<Character | undefined> {
    let sig = this.characterSigs.get(id);
    if (!sig) {
      sig = signal<Character | undefined>(undefined);
      this.characterSigs.set(id, sig);
      this.refetchCharacter(id);
    }
    return sig.asReadonly();
  }

  // ── refetch / set ──────────────────────────────────────────────────────────

  refetchList(): void {
    this.api.getCampaigns().then((v) => this.listSig.set(v)).catch((e) => console.error(e));
  }

  refetchCampaign(id: number): void {
    this.api
      .getCampaign(id)
      .then((v) => this.campaignSigs.get(id)?.set(v))
      .catch((e) => console.error(e));
  }

  refetchCombats(campaignId: number): void {
    this.api
      .getCombatsFor(campaignId)
      .then((v) => this.combatsSigs.get(campaignId)?.set(v))
      .catch((e) => console.error(e));
  }

  refetchCombat(id: number): void {
    this.api
      .getCombat(id)
      .then((v) => this.combatSigs.get(id)?.set(v))
      .catch((e) => console.error(e));
  }

  refetchCharacter(id: number): void {
    this.api
      .getCharacter(id)
      .then((v) => this.characterSigs.get(id)?.set(v))
      .catch((e) => console.error(e));
  }

  setCombat(id: number, combat: Combat): void {
    this.combatSigs.get(id)?.set(combat);
  }

  setCharacter(id: number, character: Character): void {
    this.characterSigs.get(id)?.set(character);
  }

  // ── live updates ─────────────────────────────────────────────────────────

  private onSocketEvent(event: SocketEvent): void {
    const campaignId = event.campaignId;
    this.refetchList();
    if (this.campaignSigs.has(campaignId)) this.refetchCampaign(campaignId);
    if (this.combatsSigs.has(campaignId)) this.refetchCombats(campaignId);
    for (const [combatId, sig] of this.combatSigs) {
      if (sig()?.campaign === campaignId) this.refetchCombat(combatId);
    }
    for (const [characterId, sig] of this.characterSigs) {
      if (sig()?.campaign === campaignId) this.refetchCharacter(characterId);
    }
  }
}
