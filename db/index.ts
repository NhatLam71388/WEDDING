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

  async listVisibleMessages(limit = 50): Promise<PublicMessage[]> {
    const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
    const result = await this.database
      .prepare(
        `SELECT id, name, body, created_at
         FROM messages
         WHERE is_visible = 1
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(safeLimit)
      .all<MessageRow>();

    return result.results.map((row) => ({
      id: row.id,
      name: row.name,
      body: row.body,
      createdAt: toIsoDate(row.created_at),
    }));
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
