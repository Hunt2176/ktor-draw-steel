import { Injectable } from '@angular/core';
import type {
  Campaign,
  CampaignDetails,
  Character,
  CharacterCondition,
  Combat,
  Combatant,
  DisplayEntry,
  InventoryItem,
} from '@draw-steel/shared';

export interface ModifyRequest {
  modifyBy: number;
  type: 'INCREASE' | 'DECREASE';
}

/**
 * Thin HTTP client over the backend REST API. Endpoints and payload shapes are a
 * 1:1 port of the original `services/api.ts`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private async json<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`);
    return (await res.json()) as T;
  }

  private jsonInit(method: string, body: unknown): RequestInit {
    return {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // ── campaigns ──────────────────────────────────────────────────────────────
  getCampaigns(): Promise<CampaignDetails[]> {
    return this.json('/api/campaigns');
  }
  getCampaign(id: number): Promise<CampaignDetails> {
    return this.json(`/api/campaigns/${id}`);
  }
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    return this.json(`/api/campaigns/${id}`, this.jsonInit('PATCH', campaign));
  }
  modifyHeroTokens(id: number, request: ModifyRequest): Promise<Campaign> {
    return this.json(`/api/campaigns/${id}/modify/heroTokens`, this.jsonInit('PATCH', request));
  }

  // ── characters ─────────────────────────────────────────────────────────────
  getCharacter(id: number): Promise<Character> {
    return this.json(`/api/characters/${id}`);
  }
  async createCharacter(character: Partial<Character>): Promise<void> {
    const res = await fetch('/api/characters', this.jsonInit('POST', character));
    if (!res.ok) throw new Error('Failed to create character');
  }
  saveCharacter(id: number, character: Partial<Character>): Promise<Character> {
    return this.json(`/api/characters/${id}`, this.jsonInit('PATCH', character));
  }
  async deleteCharacter(id: number): Promise<void> {
    const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete character');
  }
  modifyCharacterHp(id: number, update: { mod: number; type: 'HEAL' | 'DAMAGE' }): Promise<Character> {
    return this.json(`/api/characters/${id}/modify/health`, this.jsonInit('PATCH', update));
  }
  modifyCharacterRecovery(
    id: number,
    update: { mod: number; type: 'INCREASE' | 'DECREASE' },
  ): Promise<Character> {
    return this.json(`/api/characters/${id}/modify/recoveries`, this.jsonInit('PATCH', update));
  }

  // ── conditions ─────────────────────────────────────────────────────────────
  addCharacterCondition(update: {
    name: string;
    character: number;
    endType: 'endOfTurn' | 'save';
  }): Promise<CharacterCondition> {
    return this.json('/api/characterConditions', this.jsonInit('POST', update));
  }
  async deleteCharacterCondition(id: number): Promise<void> {
    const res = await fetch(`/api/characterConditions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete character condition');
  }

  // ── inventory ──────────────────────────────────────────────────────────────
  createInventoryItem(
    character: number,
    item: Pick<InventoryItem, 'name' | 'quantity'>,
  ): Promise<InventoryItem> {
    return this.json('/api/inventoryItem', this.jsonInit('POST', { character, ...item }));
  }
  modifyInventoryItemQuantity(id: number, request: ModifyRequest): Promise<InventoryItem> {
    return this.json(`/api/inventoryItem/${id}/modify/quantity`, this.jsonInit('PATCH', request));
  }
  async deleteInventoryItem(id: number): Promise<void> {
    const res = await fetch(`/api/inventoryItem/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete inventory item');
  }

  // ── combats ────────────────────────────────────────────────────────────────
  getCombatsFor(id: number): Promise<Combat[]> {
    return this.json(`/api/campaigns/${id}/combats`);
  }
  getCombat(id: number): Promise<Combat> {
    return this.json(`/api/combats/${id}`);
  }
  createCombat(update: { campaign: number; characters: number[] }): Promise<Combat> {
    return this.json('/api/combats/create', this.jsonInit('POST', update));
  }
  async deleteCombat(id: number): Promise<void> {
    const res = await fetch(`/api/combats/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete combat');
  }
  updateCombatRound(
    id: number,
    update: { fromRound: number; reset: boolean; updateConditions: boolean },
  ): Promise<Combat> {
    return this.json(`/api/combats/${id}/nextRound`, this.jsonInit('PATCH', update));
  }
  quickAddCombatant(
    id: number,
    update: { character: { name: string; maxHp: number; user: number; offstage: boolean } },
  ): Promise<Combat> {
    return this.json(`/api/combats/${id}/quickAdd`, this.jsonInit('PATCH', update));
  }
  updateCombatModification(
    id: number,
    update: { add?: number[]; remove?: number[] },
  ): Promise<Combat> {
    return this.json(`/api/combats/${id}/modify`, this.jsonInit('PATCH', update));
  }

  // ── combatants ─────────────────────────────────────────────────────────────
  updateCombatantActive(id: number, available: boolean): Promise<Combatant> {
    return this.json(`/api/combatants/${id}`, this.jsonInit('PATCH', { available }));
  }
  updateCombatantValue(
    id: number,
    options: { key: 'resources' | 'surges'; value: number; type: 'increase' | 'decrease' },
  ): Promise<Combatant> {
    return this.json(
      `/api/combatants/${id}/${options.key}`,
      this.jsonInit('PATCH', { type: options.type.toUpperCase(), value: options.value }),
    );
  }

  // ── files ──────────────────────────────────────────────────────────────────
  listFiles(): Promise<{ files: string[] }> {
    return this.json('/files');
  }
  async uploadFile(file: File): Promise<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/files', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to upload file');
    return (await res.json()) as { fileName: string };
  }

  // ── display entries ──────────────────────────────────────────────────────
  createDisplayEntry(entry: Omit<DisplayEntry, 'id'>): Promise<DisplayEntry> {
    return this.json('/api/displayEntry', this.jsonInit('POST', entry));
  }
  async deleteDisplayEntry(id: number): Promise<void> {
    const res = await fetch(`/api/displayEntry/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete display entry');
  }

  // ── kanka ──────────────────────────────────────────────────────────────────
  async kanka<T>(path: string): Promise<T> {
    const res = await fetch(`/kanka${path}`);
    if (!res.ok) throw new Error(`Kanka request failed: ${res.status}`);
    return (await res.json()) as T;
  }
}
