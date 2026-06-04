import type { CharacterCondition, EntityType } from '@draw-steel/shared';
import { characterConditions, type CharacterConditionRow } from '../db/schema.js';
import { campaignIdForCharacterId, toConditionDTO } from '../mapper.js';
import { BaseRepository } from './base-repository.js';
import { pickEnum, pickInt, pickString } from './field-mappers.js';

/** Character conditions (Bleeding, Dazed, …) attached to a character. */
export class CharacterConditionRepository extends BaseRepository<
  CharacterConditionRow,
  CharacterCondition
> {
  protected readonly table = characterConditions;
  protected readonly idColumn = characterConditions.id;
  readonly routeName = 'characterConditions';
  protected readonly entityType: EntityType = 'ExposedCharacterCondition';

  toDTO(row: CharacterConditionRow): CharacterCondition {
    return toConditionDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickEnum(json, 'endType', ['endOfTurn', 'save'] as const, out);
    pickString(json, 'name', out);
    pickInt(json, 'character', out);
    return out;
  }

  protected resolveCampaignId(row: CharacterConditionRow): number | null {
    return campaignIdForCharacterId(row.character);
  }
}
