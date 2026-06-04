import type { Hono } from 'hono';
import type { EntityType, InventoryItem } from '@draw-steel/shared';
import { inventoryItem, type InventoryItemRow } from '../db/schema.js';
import { campaignIdForCharacterId, toInventoryItemDTO } from '../mapper.js';
import { BaseRepository } from './base-repository.js';
import { pickInt, pickIntAtLeastZero, pickString } from './field-mappers.js';

/** Inventory items belonging to a character. */
export class InventoryItemRepository extends BaseRepository<InventoryItemRow, InventoryItem> {
  protected readonly table = inventoryItem;
  protected readonly idColumn = inventoryItem.id;
  readonly routeName = 'inventoryItem';
  protected readonly entityType: EntityType = 'ExposedInventoryItem';

  toDTO(row: InventoryItemRow): InventoryItem {
    return toInventoryItemDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickString(json, 'name', out);
    pickIntAtLeastZero(json, 'quantity', out);
    pickInt(json, 'character', out);
    return out;
  }

  protected resolveCampaignId(row: InventoryItemRow): number | null {
    return campaignIdForCharacterId(row.character);
  }

  protected override additionalRoutes(router: Hono, base: string): void {
    this.registerValueModification(router, base, 'quantity', 'quantity');
  }
}
