import type { EntityType, User } from '@draw-steel/shared';
import { users, type UserRow } from '../db/schema.js';
import { toUserDTO } from '../mapper.js';
import { BaseRepository } from './base-repository.js';
import { pickString } from './field-mappers.js';

/** Users — plain CRUD; users are not tied to a campaign so no change broadcast. */
export class UserRepository extends BaseRepository<UserRow, User> {
  protected readonly table = users;
  protected readonly idColumn = users.id;
  readonly routeName = 'users';
  // Users have no campaign and never broadcast; value is unused.
  protected readonly entityType = 'ExposedCampaign' as EntityType;

  toDTO(row: UserRow): User {
    return toUserDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickString(json, 'name', out);
    return out;
  }

  protected resolveCampaignId(): number | null {
    return null;
  }
}
