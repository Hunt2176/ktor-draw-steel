import type { DisplayEntry, EntityType } from '@draw-steel/shared';
import { displayEntry, type DisplayEntryRow } from '../db/schema.js';
import { toDisplayEntryDTO } from '../mapper.js';
import { BaseRepository } from './base-repository.js';
import { pickEnum, pickInt, pickNullableString, pickString } from './field-mappers.js';

/** Display entries — campaign-screen slides (portraits / backgrounds). */
export class DisplayEntryRepository extends BaseRepository<DisplayEntryRow, DisplayEntry> {
  protected readonly table = displayEntry;
  protected readonly idColumn = displayEntry.id;
  readonly routeName = 'displayEntry';
  protected readonly entityType: EntityType = 'ExposedDisplayEntry';

  toDTO(row: DisplayEntryRow): DisplayEntry {
    return toDisplayEntryDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickString(json, 'title', out);
    pickNullableString(json, 'description', out);
    pickNullableString(json, 'pictureUrl', out);
    pickEnum(json, 'type', ['Portrait', 'Background'] as const, out);
    pickInt(json, 'campaign', out);
    return out;
  }

  protected resolveCampaignId(row: DisplayEntryRow): number | null {
    return row.campaign;
  }
}
