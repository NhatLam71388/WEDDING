import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the worker, invitation, assets, and hosting metadata", async () => {
  await Promise.all([
    access("dist/server/index.js"),
    access("dist/client/invitation.html"),
    access("dist/client/support.js"),
    access("dist/client/image-slot.js"),
    access("dist/client/assets/decor/dove-flight.webp"),
    access("dist/.openai/hosting.json"),
  ]);

  const [invitation, sourceDove, builtDove] = await Promise.all([
    readFile("dist/client/invitation.html", "utf8"),
    readFile("assets/decor/dove-flight.webp"),
    readFile("dist/client/assets/decor/dove-flight.webp"),
  ]);
  assert.match(invitation, /Ngô Nam/);
  assert.match(invitation, /Nhật Mai/);
  assert.match(invitation, /\/api\/messages/);
  assert.match(invitation, /\/api\/rsvp/);
  assert.match(invitation, /destination=12\.7941667%2C107\.9155833/);
  assert.match(invitation, /destination=12\.7947442%2C107\.9132805/);
  assert.match(
    invitation,
    /<link rel="preload" as="image" href="\.\/assets\/decor\/dove-flight\.webp" type="image\/webp">/,
  );
  assert.match(invitation, /\bdata-introdove="1"/);
  assert.deepEqual(builtDove, sourceDove);
});
