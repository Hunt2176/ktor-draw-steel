import type { Context, Hono } from 'hono';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import {
  ValueModificationRequestSchema,
  type ChangeType,
  type EntityType,
  type SocketEvent,
} from '@draw-steel/shared';
import { db } from '../db/client.js';
import { broadcaster } from '../events/broadcaster.js';

/**
 * Generic CRUD repository + route registrar. A direct port of the original
 * Kotlin `BaseRepository` abstraction: it wires up GET (all), GET (by id),
 * DELETE, POST and PATCH against a Drizzle table, maps rows to DTOs, and
 * broadcasts every mutation as a campaign change event. Subclasses override the
 * field mapping, DTO assembly, campaign resolution, and may add custom routes.
 */
export abstract class BaseRepository<TRow extends { id: number }, TDTO> {
  protected abstract readonly table: any;
  protected abstract readonly idColumn: SQLiteColumn;
  /** Path segment under /api (the camelCase table name in the original). */
  abstract readonly routeName: string;
  /** Class-name string used in socket payloads (e.g. "ExposedCharacter"). */
  protected abstract readonly entityType: EntityType;

  /** Map a row to its public DTO. */
  abstract toDTO(row: TRow): TDTO;

  /**
   * Build the set of column values to write from an incoming JSON body. Only
   * keys present in the body are returned (partial-update semantics, matching
   * the original `customizeFromJson`).
   */
  protected abstract mapBody(json: Record<string, unknown>): Record<string, unknown>;

  /** Campaign id this row belongs to, for change broadcasting. */
  protected abstract resolveCampaignId(row: TRow): number | null;

  // ── data access ────────────────────────────────────────────────────────────

  fetchById(id: number): TRow | undefined {
    return db.select().from(this.table).where(eq(this.idColumn, id)).get() as TRow | undefined;
  }

  fetchAll(): TRow[] {
    return db.select().from(this.table).all() as TRow[];
  }

  // ── change broadcasting ──────────────────────────────────────────────────

  protected broadcast(row: TRow, changeType: ChangeType): void {
    const campaignId = this.resolveCampaignId(row);
    if (campaignId == null) return;
    broadcaster.emit({
      entityType: this.entityType,
      campaignId,
      dataId: row.id,
      data: this.toDTO(row) as SocketEvent['data'],
      changeType,
    });
  }

  // ── handlers (overridable) ────────────────────────────────────────────────

  protected handleGetAll(c: Context): Response | Promise<Response> {
    const rows = this.fetchAll();
    return c.json(rows.map((r) => this.toDTO(r)));
  }

  protected handleGetById(c: Context): Response | Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const row = this.fetchById(id);
    if (!row) return c.text('Entity not found', 404);
    return c.json(this.toDTO(row));
  }

  protected handleDelete(c: Context): Response | Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const row = this.fetchById(id);
    if (!row) return c.text('Entity not found', 404);
    db.delete(this.table).where(eq(this.idColumn, id)).run();
    this.broadcast(row, 'Removed');
    return c.text('Entity deleted', 200);
  }

  protected async handlePost(c: Context): Promise<Response> {
    const json = (await c.req.json()) as Record<string, unknown>;
    const values = this.mapBody(json);
    const inserted = db.insert(this.table).values(values).returning().get() as TRow;
    this.broadcast(inserted, 'Created');
    return c.json(this.toDTO(inserted), 201);
  }

  protected async handlePatch(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const existing = this.fetchById(id);
    if (!existing) return c.text('Entity not found', 404);
    const json = (await c.req.json()) as Record<string, unknown>;
    const values = this.mapBody(json);
    const updated =
      Object.keys(values).length > 0
        ? (db.update(this.table).set(values).where(eq(this.idColumn, id)).returning().get() as TRow)
        : existing;
    this.broadcast(updated, 'Updated');
    return c.json(this.toDTO(updated));
  }

  // ── route registration ─────────────────────────────────────────────────────

  /** Hook for subclasses to register custom routes (the original additionalRouteSetup). */
  protected additionalRoutes(_router: Hono, _base: string): void {
    /* override me */
  }

  /**
   * Register a PATCH `/:id/modify/{type}` route that applies a clamped +/-
   * delta to a single numeric column. Port of the original
   * `createValueModificationRoute`.
   */
  protected registerValueModification(
    router: Hono,
    base: string,
    type: string,
    field: keyof TRow & string,
  ): void {
    router.patch(`${base}/:id/modify/${type}`, async (c) => {
      const id = parseId(c);
      if (id == null) return c.text('Invalid ID', 400);
      const row = this.fetchById(id);
      if (!row) return c.text('Entity not found', 404);
      const body = ValueModificationRequestSchema.parse(await c.req.json());
      const current = Number((row as Record<string, unknown>)[field]);
      const next =
        body.type === 'INCREASE'
          ? atLeastZero(current + body.modifyBy)
          : atLeastZero(current - body.modifyBy);
      const updated = db
        .update(this.table)
        .set({ [field]: next })
        .where(eq(this.idColumn, id))
        .returning()
        .get() as TRow;
      this.broadcast(updated, 'Updated');
      return c.json(this.toDTO(updated));
    });
  }

  registerRoutes(router: Hono): void {
    const base = `/${this.routeName}`;
    router.get(base, (c) => this.handleGetAll(c));
    router.get(`${base}/:id`, (c) => this.handleGetById(c));
    router.delete(`${base}/:id`, (c) => this.handleDelete(c));
    router.post(base, (c) => this.handlePost(c));
    router.patch(`${base}/:id`, (c) => this.handlePatch(c));
    this.additionalRoutes(router, base);
  }
}

export function parseId(c: Context, key = 'id'): number | null {
  const raw = c.req.param(key);
  if (raw == null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/** Clamp helper matching Kotlin `coerceAtLeast(0)`. */
export const atLeastZero = (n: number): number => Math.max(n, 0);
