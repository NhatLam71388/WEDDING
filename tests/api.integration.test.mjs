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

test("live APIs persist, deduplicate, moderate, and reject oversized input", async () => {
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
    );
    assert.equal(response.status, 200);
    assert.deepEqual((await json(response)).messages, []);

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
    assert.equal(csv.split("\r\n").length, 2);
    assert.match(csv, /Không tham dự/);

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
  } finally {
    await miniflare.dispose();
  }
});
