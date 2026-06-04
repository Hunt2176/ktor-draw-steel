import { pickBool, pickInt, pickNullableString, pickString } from './field-mappers.js';

/**
 * Map a JSON body to character column values. Shared between the character
 * repository's create/patch and the combat "quick add" route (which builds a
 * character on the fly), mirroring the original `customizeFromJson`.
 */
export function mapCharacterBody(json: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  pickString(json, 'name', out);
  pickInt(json, 'might', out);
  pickInt(json, 'agility', out);
  pickInt(json, 'reason', out);
  pickInt(json, 'intuition', out);
  pickInt(json, 'presence', out);
  pickInt(json, 'removedHp', out);
  pickInt(json, 'maxHp', out);
  pickInt(json, 'temporaryHp', out);
  pickInt(json, 'removedRecoveries', out);
  pickInt(json, 'maxRecoveries', out);
  pickInt(json, 'temporaryRecoveries', out);
  pickInt(json, 'minions', out);
  pickBool(json, 'offstage', out);
  pickNullableString(json, 'resourceName', out);
  pickInt(json, 'victories', out);
  pickNullableString(json, 'pictureUrl', out);
  pickNullableString(json, 'border', out);
  pickInt(json, 'campaign', out);
  pickInt(json, 'user', out);
  return out;
}
