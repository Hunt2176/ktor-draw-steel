/**
 * Re-exports the shared DTO types plus a few client-side helpers (HP/recovery
 * pool maths and an empty-character factory) that the original kept in
 * `types/models.ts`.
 */
export type {
  Campaign,
  CampaignDetails,
  Character,
  CharacterCondition,
  CharacterConditionEndType,
  Combat,
  Combatant,
  DisplayEntry,
  DisplayEntryType,
  InventoryItem,
  SocketEvent,
  User,
} from '@draw-steel/shared';

import type { Character } from '@draw-steel/shared';

export interface CharacterPool {
  current: number;
  max: number;
  percent: number;
  temporary: number;
}

export function getHp(char: Character): CharacterPool {
  const current = char.maxHp + char.temporaryHp - char.removedHp;
  const percent = current / char.maxHp;
  return { current, max: char.maxHp, percent, temporary: char.temporaryHp };
}

export function getRecoveries(char: Character): CharacterPool {
  const current = Math.max(
    char.maxRecoveries + char.temporaryRecoveries - char.removedRecoveries,
    0,
  );
  const percent = current / char.maxRecoveries;
  return { current, max: char.maxRecoveries, percent, temporary: char.temporaryRecoveries };
}

export function emptyCharacter(): Character {
  return {
    id: -1,
    name: '',
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
    removedHp: 0,
    maxHp: 0,
    temporaryHp: 0,
    removedRecoveries: 0,
    temporaryRecoveries: 0,
    maxRecoveries: 0,
    resourceName: null,
    victories: 0,
    user: -1,
    campaign: -1,
    pictureUrl: null,
    border: null,
    offstage: false,
    minions: 0,
    conditions: [],
    inventory: [],
  };
}
