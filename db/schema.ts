import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Public wedding wishes.
 *
 * `ipHash` is deliberately kept out of every public API response. It exists
 * only to enforce the short, per-IP write limit.
 */
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    body: text("body").notNull(),
    isVisible: integer("is_visible", { mode: "boolean" })
      .notNull()
      .default(true),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("messages_visible_created_idx").on(
      table.isVisible,
      table.createdAt,
    ),
    index("messages_ip_created_idx").on(table.ipHash, table.createdAt),
    check(
      "messages_name_length_check",
      sql`length(${table.name}) between 1 and 60`,
    ),
    check(
      "messages_body_length_check",
      sql`length(${table.body}) between 1 and 400`,
    ),
    check(
      "messages_ip_hash_length_check",
      sql`length(${table.ipHash}) = 64`,
    ),
  ],
);

/**
 * Attendance confirmations. `attend` and `side` are strings instead of SQLite
 * booleans so generated migrations retain the exact public API vocabulary.
 */
export const rsvps = sqliteTable(
  "rsvps",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    count: integer("guest_count").notNull(),
    attend: text("attend", { enum: ["yes", "no"] }).notNull(),
    side: text("side", { enum: ["groom", "bride"] }).notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("rsvps_ip_created_idx").on(table.ipHash, table.createdAt),
    index("rsvps_created_idx").on(table.createdAt),
    check(
      "rsvps_name_length_check",
      sql`length(${table.name}) between 1 and 60`,
    ),
    check(
      "rsvps_count_check",
      sql`${table.count} between 0 and 20`,
    ),
    check(
      "rsvps_attend_check",
      sql`${table.attend} in ('yes', 'no')`,
    ),
    check(
      "rsvps_side_check",
      sql`${table.side} in ('groom', 'bride')`,
    ),
    check(
      "rsvps_ip_hash_length_check",
      sql`length(${table.ipHash}) = 64`,
    ),
  ],
);

export type MessageRecord = typeof messages.$inferSelect;
export type NewMessageRecord = typeof messages.$inferInsert;
export type RsvpRecord = typeof rsvps.$inferSelect;
export type NewRsvpRecord = typeof rsvps.$inferInsert;
