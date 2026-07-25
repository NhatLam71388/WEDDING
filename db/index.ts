import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface RuntimeBindings {
  DB: D1Database;
  RATE_LIMIT_SALT?: string;
  ADMIN_TOKEN?: string;
}

export interface PublicMessage {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

export interface MessageCursor {
  createdAt: number;
  id: string;
}

export interface PublicMessagePage {
  messages: PublicMessage[];
  nextCursor: MessageCursor | null;
  hasMore: boolean;
}

export interface PublicRsvp {
  id: string;
  name: string;
  count: number;
  attend: "yes" | "no";
  side: "groom" | "bride";
  createdAt: string;
}

interface MessageRow {
  id: string;
  name: string;
  body: string;
  created_at: number;
}

interface MessageInsert {
  id: string;
  name: string;
  body: string;
  ipHash: string;
  createdAt: number;
}

interface RsvpInsert {
  id: string;
  name: string;
  count: number;
  attend: "yes" | "no";
  side: "groom" | "bride";
  ipHash: string;
  createdAt: number;
}

function toIsoDate(timestamp: number): string {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid timestamp returned by D1");
  }
  return date.toISOString();
}

function changedRows(result: D1Result<unknown>): number {
  return Number(result.meta?.changes ?? 0);
}

/**
 * All SQL used by API routes is kept here and uses D1 prepared statements.
 * The INSERT ... SELECT form makes each limit check and write one SQLite
 * operation, preventing concurrent requests from bypassing the rate limit.
 */
export class WeddingDatabase {
  constructor(private readonly database: D1Database) {}

  async listVisibleMessages(
    limit = 12,
    cursor?: MessageCursor,
  ): Promise<PublicMessagePage> {
    const safeLimit = Math.max(1, Math.min(24, Math.trunc(limit)));
    const fetchLimit = safeLimit + 1;
    const statement = cursor
      ? this.database
          .prepare(
            `SELECT id, name, body, created_at
             FROM messages
             WHERE is_visible = 1
               AND (
                 created_at < ?
                 OR (created_at = ? AND id < ?)
               )
             ORDER BY created_at DESC, id DESC
             LIMIT ?`,
          )
          .bind(cursor.createdAt, cursor.createdAt, cursor.id, fetchLimit)
      : this.database
          .prepare(
            `SELECT id, name, body, created_at
             FROM messages
             WHERE is_visible = 1
             ORDER BY created_at DESC, id DESC
             LIMIT ?`,
          )
          .bind(fetchLimit);
    const result = await statement.all<MessageRow>();
    const hasMore = result.results.length > safeLimit;
    const visibleRows = result.results.slice(0, safeLimit);
    const lastRow = visibleRows.at(-1);

    return {
      messages: visibleRows.map((row) => ({
        id: row.id,
        name: row.name,
        body: row.body,
        createdAt: toIsoDate(row.created_at),
      })),
      nextCursor:
        hasMore && lastRow
          ? { createdAt: Number(lastRow.created_at), id: lastRow.id }
          : null,
      hasMore,
    };
  }

  async insertMessageWithinLimit(
    input: MessageInsert,
    since: number,
    limit: number,
  ): Promise<boolean> {
    const result = await this.database
      .prepare(
        `INSERT INTO messages
           (id, name, body, is_visible, ip_hash, created_at)
         SELECT ?, ?, ?, 1, ?, ?
         WHERE (
           SELECT COUNT(*)
           FROM messages
           WHERE ip_hash = ? AND created_at >= ?
         ) < ?`,
      )
      .bind(
        input.id,
        input.name,
        input.body,
        input.ipHash,
        input.createdAt,
        input.ipHash,
        since,
        limit,
      )
      .run();

    return changedRows(result) === 1;
  }

  async insertRsvpWithinLimit(
    input: RsvpInsert,
    since: number,
    limit: number,
  ): Promise<boolean> {
    const result = await this.database
      .prepare(
        `INSERT INTO rsvps
           (id, name, guest_count, attend, side, ip_hash, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?
         WHERE (
           SELECT COUNT(*)
           FROM rsvps
           WHERE ip_hash = ? AND created_at >= ?
         ) < ?`,
      )
      .bind(
        input.id,
        input.name,
        input.count,
        input.attend,
        input.side,
        input.ipHash,
        input.createdAt,
        input.ipHash,
        since,
        limit,
      )
      .run();

    return changedRows(result) === 1;
  }

  async upsertRsvpWithinLimit(
    input: RsvpInsert,
    since: number,
    limit: number,
  ): Promise<boolean> {
    const result = await this.database
      .prepare(
        `INSERT INTO rsvps
           (id, name, guest_count, attend, side, ip_hash, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM rsvps WHERE id = ?
         ) OR (
           SELECT COUNT(*)
           FROM rsvps
           WHERE ip_hash = ? AND created_at >= ?
         ) < ?
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           guest_count = excluded.guest_count,
           attend = excluded.attend,
           side = excluded.side,
           ip_hash = excluded.ip_hash,
           created_at = excluded.created_at`,
      )
      .bind(
        input.id,
        input.name,
        input.count,
        input.attend,
        input.side,
        input.ipHash,
        input.createdAt,
        input.id,
        input.ipHash,
        since,
        limit,
      )
      .run();

    return changedRows(result) === 1;
  }

  toPublicMessage(input: MessageInsert): PublicMessage {
    return {
      id: input.id,
      name: input.name,
      body: input.body,
      createdAt: toIsoDate(input.createdAt),
    };
  }

  toPublicRsvp(input: RsvpInsert): PublicRsvp {
    return {
      id: input.id,
      name: input.name,
      count: input.count,
      attend: input.attend,
      side: input.side,
      createdAt: toIsoDate(input.createdAt),
    };
  }
}

export function getRuntimeBindings(): RuntimeBindings {
  const bindings = env as unknown as Partial<RuntimeBindings>;
  if (!bindings.DB) {
    throw new Error("Cloudflare D1 binding DB is not configured");
  }
  return bindings as RuntimeBindings;
}

export function getDatabase(): WeddingDatabase {
  return new WeddingDatabase(getRuntimeBindings().DB);
}

/**
 * Drizzle is exposed for migration-aware internal/admin queries, while public
 * API writes continue to use the atomic prepared statements above.
 */
export function getDrizzleDatabase() {
  return drizzle(getRuntimeBindings().DB, { schema });
}
