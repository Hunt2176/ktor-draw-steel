import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

export interface CreateCombatUpdate {
  campaign: number;
  characters: number[];
}

export interface CombatRoundUpdate {
  fromRound: number;
  reset: boolean;
  updateConditions: boolean;
}

export interface CombatModificationUpdate {
  add?: number[];
  remove?: number[];
}

export interface QuickAddCharacter {
  name: string;
  maxHp: number;
  user: number;
  offstage: boolean;
}

/** Thin client over the REST API, mirroring the original `services/api.ts`. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ----- Campaigns -----
  fetchCampaigns(): Promise<CampaignDetails[]> {
    return firstValueFrom(this.http.get<CampaignDetails[]>('/api/campaigns'));
  }

  fetchCampaign(id: number): Promise<CampaignDetails> {
    return firstValueFrom(this.http.get<CampaignDetails>(`/api/campaigns/${id}`));
  }

  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    return firstValueFrom(
      this.http.patch<Campaign>(`/api/campaigns/${id}`, campaign),
    );
  }

  modifyHeroTokens(campaignId: number, request: ModifyRequest): Promise<Campaign> {
    return firstValueFrom(
      this.http.patch<Campaign>(
        `/api/campaigns/${campaignId}/modify/heroTokens`,
        request,
      ),
    );
  }

  // ----- Characters -----
  fetchCharacter(id: number): Promise<Character> {
    return firstValueFrom(this.http.get<Character>(`/api/characters/${id}`));
  }

  createCharacter(character: Partial<Character>): Promise<Character> {
    return firstValueFrom(
      this.http.post<Character>('/api/characters', character),
    );
  }

  saveCharacter(id: number, character: Partial<Character>): Promise<Character> {
    return firstValueFrom(
      this.http.patch<Character>(`/api/characters/${id}`, character),
    );
  }

  deleteCharacter(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/characters/${id}`));
  }

  modifyCharacterHp(
    id: number,
    update: { mod: number; type: 'HEAL' | 'DAMAGE' },
  ): Promise<Character> {
    return firstValueFrom(
      this.http.patch<Character>(`/api/characters/${id}/modify/health`, update),
    );
  }

  modifyCharacterRecovery(
    id: number,
    update: { mod: number; type: 'INCREASE' | 'DECREASE' },
  ): Promise<Character> {
    return firstValueFrom(
      this.http.patch<Character>(
        `/api/characters/${id}/modify/recoveries`,
        update,
      ),
    );
  }

  // ----- Conditions -----
  addCharacterCondition(update: {
    name: string;
    character: number;
    endType: 'endOfTurn' | 'save';
  }): Promise<CharacterCondition> {
    return firstValueFrom(
      this.http.post<CharacterCondition>('/api/characterConditions', update),
    );
  }

  deleteCharacterCondition(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/characterConditions/${id}`));
  }

  // ----- Inventory -----
  createInventoryItem(
    character: number,
    item: Pick<InventoryItem, 'name' | 'quantity'>,
  ): Promise<InventoryItem> {
    return firstValueFrom(
      this.http.post<InventoryItem>('/api/inventoryItem', { character, ...item }),
    );
  }

  modifyInventoryItemQuantity(
    id: number,
    request: ModifyRequest,
  ): Promise<InventoryItem> {
    return firstValueFrom(
      this.http.patch<InventoryItem>(
        `/api/inventoryItem/${id}/modify/quantity`,
        request,
      ),
    );
  }

  deleteInventoryItem(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/inventoryItem/${id}`));
  }

  // ----- Combats -----
  fetchCombatsFor(id: number): Promise<Combat[]> {
    return firstValueFrom(this.http.get<Combat[]>(`/api/campaigns/${id}/combats`));
  }

  fetchCombat(id: number): Promise<Combat> {
    return firstValueFrom(this.http.get<Combat>(`/api/combats/${id}`));
  }

  createCombat(update: CreateCombatUpdate): Promise<Combat> {
    return firstValueFrom(this.http.post<Combat>('/api/combats/create', update));
  }

  deleteCombat(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/combats/${id}`));
  }

  updateCombatRound(id: number, update: CombatRoundUpdate): Promise<Combat> {
    return firstValueFrom(
      this.http.patch<Combat>(`/api/combats/${id}/nextRound`, update),
    );
  }

  quickAddCombatant(
    id: number,
    update: { character: QuickAddCharacter },
  ): Promise<Combat> {
    return firstValueFrom(
      this.http.patch<Combat>(`/api/combats/${id}/quickAdd`, update),
    );
  }

  updateCombatCombatant(
    id: number,
    type: 'add' | 'remove',
    update: { character: number },
  ): Promise<Combat> {
    return firstValueFrom(
      this.http.patch<Combat>(`/api/combats/${id}/${type}`, update),
    );
  }

  updateCombatModification(
    id: number,
    update: CombatModificationUpdate,
  ): Promise<Combat> {
    return firstValueFrom(
      this.http.patch<Combat>(`/api/combats/${id}/modify`, update),
    );
  }

  updateCombatantActive(id: number, available: boolean): Promise<Combatant> {
    return firstValueFrom(
      this.http.patch<Combatant>(`/api/combatants/${id}`, { available }),
    );
  }

  updateCombatantValue(
    id: number,
    opts: { key: 'resources' | 'surges'; value: number; type: 'increase' | 'decrease' },
  ): Promise<Combatant> {
    return firstValueFrom(
      this.http.patch<Combatant>(`/api/combatants/${id}/${opts.key}`, {
        type: opts.type.toUpperCase(),
        value: opts.value,
      }),
    );
  }

  // ----- Files -----
  listFiles(): Promise<{ files: string[] }> {
    return firstValueFrom(this.http.get<{ files: string[] }>('/files'));
  }

  uploadFile(file: File): Promise<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<{ fileName: string }>('/files', formData),
    );
  }

  // ----- Display entries -----
  createDisplayEntry(entry: Omit<DisplayEntry, 'id'>): Promise<DisplayEntry> {
    return firstValueFrom(
      this.http.post<DisplayEntry>('/api/displayEntry', entry),
    );
  }

  deleteDisplayEntry(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/displayEntry/${id}`));
  }
}
