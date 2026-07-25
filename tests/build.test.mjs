import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the worker, invitation, assets, and hosting metadata", async () => {
  await Promise.all([
    access("dist/server/index.js"),
    access("dist/client/invitation.html"),
    access("dist/client/support.js"),
    access("dist/client/image-slot.js"),
    access("dist/.openai/hosting.json"),
  ]);

  const invitation = await readFile("dist/client/invitation.html", "utf8");
  assert.match(invitation, /Ngô Nam/);
  assert.match(invitation, /Nhật Mai/);
  assert.match(invitation, /\/api\/messages/);
  assert.match(invitation, /\/api\/rsvp/);
  assert.match(invitation, /destination=12\.7941667%2C107\.9155833/);
  assert.match(invitation, /destination=12\.7947442%2C107\.9132805/);
});
