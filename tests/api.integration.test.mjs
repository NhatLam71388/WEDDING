import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import test from "node:test";
import { build } from "esbuild";
import { Miniflare } from "miniflare";

const ADMIN_TOKEN = "integration-admin-token";
const TEST_HEADERS = {
  "content-type": "application/json",
  "cf-connecting-ip": "198.51.100.10",
};

async function json(response) {
  return response.json();
}

function adminPost(miniflare, body) {
  return miniflare.dispatchFetch("http://wedding.test/api/admin/dashboard", {
    method: "POST",
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("live APIs paginate, persist RSVP identity, moderate, and reject oversized input", async () => {
  await mkdir(".wrangler", { recursive: true });
  await build({
    entryPoints: ["tests/api-worker.ts"],
    outfile: ".wrangler/api-test-worker.mjs",
    bundle: true,
    format: "esm",
    platform: "browser",
    external: ["cloudflare:workers"],
    logLevel: "silent",
  });

  const miniflare = new Miniflare({
    modules: true,
    scriptPath: ".wrangler/api-test-worker.mjs",
    compatibilityDate: "2026-07-25",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    bindings: {
      ADMIN_TOKEN,
      RATE_LIMIT_SALT: "integration-rate-limit-salt",
    },
  });

  try {
    const database = await miniflare.getD1Database("DB");
    const migration = await readFile(
      "drizzle/0000_conscious_the_fallen.sql",
      "utf8",
    );
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);
    await database.batch(
      statements.map((statement) => database.prepare(statement)),
    );

    let response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages",
      {
        headers: {
          origin: "https://ngo-nam-nhat-mai-wedding.vercel.app",
        },
      },
    );
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://ngo-nam-nhat-mai-wedding.vercel.app",
    );
    const emptyPage = await json(response);
    assert.deepEqual(emptyPage.messages, []);
    assert.equal(emptyPage.nextCursor, null);
    assert.equal(emptyPage.hasMore, false);

    const seededMessages = Array.from({ length: 31 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      name: `Khách ${index}`,
      body: `Lời chúc ${index}`,
      createdAt: 1_700_000_000_000 + Math.floor(index / 3),
    }));
    await database.batch(
      seededMessages.map((message) =>
        database
          .prepare(
            `INSERT INTO messages
               (id, name, body, is_visible, ip_hash, created_at)
             VALUES (?, ?, ?, 1, ?, ?)`,
          )
          .bind(
            message.id,
            message.name,
            message.body,
            message.id.replaceAll("-", "").padEnd(64, "0"),
            message.createdAt,
          ),
      ),
    );
    const expectedMessageIds = [...seededMessages]
      .sort(
        (left, right) =>
          right.createdAt - left.createdAt ||
          right.id.localeCompare(left.id),
      )
      .map((message) => message.id);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages",
    );
    assert.equal(response.status, 200);
    const defaultPage = await json(response);
    assert.equal(defaultPage.messages.length, 12);
    assert.equal(defaultPage.hasMore, true);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages?limit=7",
    );
    assert.equal(response.status, 200);
    let messagePage = await json(response);
    const pagedMessageIds = messagePage.messages.map((message) => message.id);
    assert.equal(messagePage.messages.length, 7);
    assert.equal(messagePage.hasMore, true);
    assert.equal(typeof messagePage.nextCursor, "string");

    await database
      .prepare(
        `INSERT INTO messages
           (id, name, body, is_visible, ip_hash, created_at)
         VALUES (?, ?, ?, 1, ?, ?)`,
      )
      .bind(
        "ffffffff-ffff-4fff-bfff-ffffffffffff",
        "Lời chúc mới",
        "Được thêm sau khi tải trang đầu",
        "f".repeat(64),
        1_700_000_001_000,
      )
      .run();

    while (messagePage.hasMore) {
      response = await miniflare.dispatchFetch(
        `http://wedding.test/api/messages?limit=7&cursor=${encodeURIComponent(messagePage.nextCursor)}`,
      );
      assert.equal(response.status, 200);
      messagePage = await json(response);
      pagedMessageIds.push(
        ...messagePage.messages.map((message) => message.id),
      );
    }
    assert.equal(messagePage.nextCursor, null);
    assert.deepEqual(pagedMessageIds, expectedMessageIds);
    assert.equal(new Set(pagedMessageIds).size, seededMessages.length);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages?cursor=not-a-valid-cursor",
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).field, "cursor");

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages?limit=999",
    );
    assert.equal(response.status, 200);
    assert.equal((await json(response)).messages.length, 24);

    await database.prepare("DELETE FROM messages").run();

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://ngo-nam-nhat-mai-wedding.vercel.app",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      },
    );
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://ngo-nam-nhat-mai-wedding.vercel.app",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://untrusted.example",
          "access-control-request-method": "POST",
        },
      },
    );
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages",
      {
        method: "POST",
        headers: TEST_HEADERS,
        body: JSON.stringify({
          name: "Khách kiểm thử",
          body: "Chúc hai bạn trăm năm hạnh phúc!",
          website: "",
        }),
      },
    );
    assert.equal(response.status, 201);
    const createdMessage = (await json(response)).message;
    assert.equal(createdMessage.name, "Khách kiểm thử");

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: {
          ...TEST_HEADERS,
          "cf-connecting-ip": "198.51.100.11",
        },
        body: JSON.stringify({
          name: "Nguyễn Văn A",
          count: 2,
          attend: "yes",
          side: "groom",
          website: "",
        }),
      },
    );
    assert.equal(response.status, 201);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: {
          ...TEST_HEADERS,
          "cf-connecting-ip": "198.51.100.11",
        },
        body: JSON.stringify({
          name: "Nguyễn Văn A",
          count: 0,
          attend: "no",
          side: "groom",
          website: "",
        }),
      },
    );
    assert.equal(response.status, 201);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      { headers: { authorization: "Bearer wrong-token" } },
    );
    assert.equal(response.status, 401);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    assert.equal(response.status, 200);
    const dashboard = await json(response);
    assert.equal(dashboard.stats.rsvps.totalResponses, 1);
    assert.equal(dashboard.stats.rsvps.attendingGuests, 0);
    assert.equal(dashboard.stats.rsvps.declinedResponses, 1);
    assert.equal(dashboard.messages.length, 1);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/export?type=rsvps",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    assert.equal(response.status, 200);
    const csv = await response.text();
    // Leading BOM + "sep=," directive, then the header row and one data row.
    // response.text() strips the leading BOM per the Fetch spec, so only the
    // "sep=," directive is observable here.
    assert.match(csv, /^﻿?sep=,\r\n/);
    assert.equal(csv.split("\r\n").length, 3);
    assert.match(csv, /Không tham dự/);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: {
          ...TEST_HEADERS,
          "cf-connecting-ip": "198.51.100.14",
        },
        body: JSON.stringify({
          name: "Mã không hợp lệ",
          count: 1,
          attend: "yes",
          side: "bride",
          responseId: "rsvp_not-a-uuid",
        }),
      },
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).field, "responseId");

    const firstResponseId =
      "rsvp_11111111-1111-4111-8111-111111111111";
    const secondResponseId =
      "rsvp_22222222-2222-4222-8222-222222222222";
    const identityHeaders = {
      ...TEST_HEADERS,
      "cf-connecting-ip": "198.51.100.12",
    };

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: identityHeaders,
        body: JSON.stringify({
          name: "Khách định danh",
          count: 2,
          attend: "yes",
          side: "bride",
          responseId: firstResponseId,
        }),
      },
    );
    assert.equal(response.status, 201);
    assert.equal((await json(response)).rsvp.id, firstResponseId);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: identityHeaders,
        body: JSON.stringify({
          name: "Khách định danh",
          count: 0,
          attend: "no",
          side: "bride",
          responseId: firstResponseId,
        }),
      },
    );
    assert.equal(response.status, 201);
    assert.equal((await json(response)).rsvp.id, firstResponseId);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/rsvp",
      {
        method: "POST",
        headers: identityHeaders,
        body: JSON.stringify({
          name: "Khách định danh",
          count: 3,
          attend: "yes",
          side: "bride",
          responseId: secondResponseId,
        }),
      },
    );
    assert.equal(response.status, 201);
    assert.equal((await json(response)).rsvp.id, secondResponseId);

    const identityRows = await database
      .prepare(
        `SELECT id, guest_count, attend
         FROM rsvps
         WHERE id IN (?, ?)
         ORDER BY id`,
      )
      .bind(firstResponseId, secondResponseId)
      .all();
    assert.equal(identityRows.results.length, 2);
    assert.deepEqual(identityRows.results[0], {
      id: firstResponseId,
      guest_count: 0,
      attend: "no",
    });
    assert.deepEqual(identityRows.results[1], {
      id: secondResponseId,
      guest_count: 3,
      attend: "yes",
    });

    const racingResponseId =
      "rsvp_33333333-3333-4333-8333-333333333333";
    const racingRequest = {
      method: "POST",
      headers: {
        ...TEST_HEADERS,
        "cf-connecting-ip": "198.51.100.13",
      },
      body: JSON.stringify({
        name: "Khách gửi lại đồng thời",
        count: 1,
        attend: "yes",
        side: "groom",
        responseId: racingResponseId,
      }),
    };
    const racingResponses = await Promise.all([
      miniflare.dispatchFetch(
        "http://wedding.test/api/rsvp",
        racingRequest,
      ),
      miniflare.dispatchFetch(
        "http://wedding.test/api/rsvp",
        racingRequest,
      ),
    ]);
    assert.deepEqual(
      racingResponses.map((item) => item.status),
      [201, 201],
    );
    const racingCount = await database
      .prepare("SELECT COUNT(*) AS total FROM rsvps WHERE id = ?")
      .bind(racingResponseId)
      .first();
    assert.equal(Number(racingCount.total), 1);
    await database
      .prepare("DELETE FROM rsvps WHERE id = ?")
      .bind(racingResponseId)
      .run();

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    assert.equal(response.status, 200);
    const identityDashboard = await json(response);
    assert.equal(identityDashboard.stats.rsvps.totalResponses, 3);
    assert.equal(identityDashboard.stats.rsvps.attendingResponses, 1);
    assert.equal(identityDashboard.stats.rsvps.declinedResponses, 2);
    assert.equal(identityDashboard.stats.rsvps.attendingGuests, 3);
    assert.equal(identityDashboard.stats.rsvps.brideGuests, 3);
    assert.equal(identityDashboard.rsvps.length, 3);
    assert.ok(
      identityDashboard.rsvps.some(
        (item) => item.id === firstResponseId && item.attend === "no",
      ),
    );
    assert.ok(
      identityDashboard.rsvps.some(
        (item) => item.id === secondResponseId && item.attend === "yes",
      ),
    );

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/export?type=rsvps",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    assert.equal(response.status, 200);
    const identityCsv = await response.text();
    assert.match(identityCsv, /^﻿?sep=,\r\n/);
    assert.equal(identityCsv.split("\r\n").length, 5);
    assert.equal(identityCsv.split(firstResponseId).length - 1, 1);
    assert.equal(identityCsv.split(secondResponseId).length - 1, 1);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "set-message-visibility",
          id: createdMessage.id,
          visible: false,
        }),
      },
    );
    assert.equal(response.status, 200);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages",
      { headers: {} },
    );
    assert.deepEqual((await json(response)).messages, []);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/messages",
      {
        method: "POST",
        headers: TEST_HEADERS,
        body: JSON.stringify({
          name: "A",
          body: "x".repeat(5_000),
          website: "",
        }),
      },
    );
    assert.equal(response.status, 413);

    // Deleting an RSVP removes exactly that row and recomputes the statistics.
    response = await adminPost(miniflare, {
      action: "delete-rsvp",
      id: secondResponseId,
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), {
      success: true,
      id: secondResponseId,
      deleted: true,
    });

    response = await adminPost(miniflare, {
      action: "delete-rsvp",
      id: secondResponseId,
    });
    assert.equal(response.status, 404);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    const afterRsvpDelete = await json(response);
    assert.equal(afterRsvpDelete.rsvps.length, 2);
    assert.ok(
      !afterRsvpDelete.rsvps.some((item) => item.id === secondResponseId),
    );
    assert.equal(afterRsvpDelete.stats.rsvps.totalResponses, 2);
    assert.equal(afterRsvpDelete.stats.rsvps.attendingGuests, 0);

    // Deleting a wish removes it outright rather than just hiding it.
    response = await adminPost(miniflare, {
      action: "delete-message",
      id: createdMessage.id,
    });
    assert.equal(response.status, 200);

    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } },
    );
    const afterMessageDelete = await json(response);
    assert.equal(afterMessageDelete.messages.length, 0);
    assert.equal(afterMessageDelete.stats.messages.total, 0);

    // Unknown actions and malformed ids stay rejected.
    response = await adminPost(miniflare, {
      action: "drop-everything",
      id: createdMessage.id,
    });
    assert.equal(response.status, 400);

    response = await adminPost(miniflare, { action: "delete-rsvp", id: "" });
    assert.equal(response.status, 400);

    // Deletes still require the admin token.
    response = await miniflare.dispatchFetch(
      "http://wedding.test/api/admin/dashboard",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete-rsvp", id: firstResponseId }),
      },
    );
    assert.equal(response.status, 401);
  } finally {
    await miniflare.dispose();
  }
});
