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
    access("dist/client/assets/photos/LBS02087-mobile-640.webp"),
    access("dist/client/assets/photos/LBS02087-mobile-841.webp"),
    access("dist/client/assets/audio/wedding-01-francisco-alvear.mp3"),
    access("dist/client/assets/photos/LBS02643-640.webp"),
    access("dist/client/assets/photos/LBS01523_1-640.webp"),
    access("dist/client/assets/photos/LBS01781-640.webp"),
    access("dist/client/assets/photos/LBS02261-640.webp"),
    access("dist/client/assets/photos/LBS02261-1280.webp"),
    access("dist/client/assets/photos/LBS02201-640.webp"),
    access("dist/.openai/hosting.json"),
  ]);

  const [
    invitation,
    sourceDove,
    builtDove,
    sourceMobile640,
    builtMobile640,
    sourceMobile841,
    builtMobile841,
    sourceMusic,
    builtMusic,
    sourceHandholding640,
    builtHandholding640,
    sourceHandholding1280,
    builtHandholding1280,
  ] = await Promise.all([
    readFile("dist/client/invitation.html", "utf8"),
    readFile("assets/decor/dove-flight.webp"),
    readFile("dist/client/assets/decor/dove-flight.webp"),
    readFile("assets/photos/LBS02087-mobile-640.webp"),
    readFile("dist/client/assets/photos/LBS02087-mobile-640.webp"),
    readFile("assets/photos/LBS02087-mobile-841.webp"),
    readFile("dist/client/assets/photos/LBS02087-mobile-841.webp"),
    readFile("assets/audio/wedding-01-francisco-alvear.mp3"),
    readFile("dist/client/assets/audio/wedding-01-francisco-alvear.mp3"),
    readFile("assets/photos/LBS02261-640.webp"),
    readFile("dist/client/assets/photos/LBS02261-640.webp"),
    readFile("assets/photos/LBS02261-1280.webp"),
    readFile("dist/client/assets/photos/LBS02261-1280.webp"),
  ]);
  assert.match(invitation, /Ngô Nam/);
  assert.match(invitation, /Nhật Mai/);
  assert.match(invitation, /\/api\/messages/);
  assert.match(invitation, /\/api\/rsvp/);
  assert.match(invitation, /destination=12\.7941667%2C107\.9155833/);
  assert.match(invitation, /destination=12\.795142%2C107\.913681/);
  assert.match(
    invitation,
    /<link rel="preload" as="image" href="\.\/assets\/decor\/dove-flight\.webp" type="image\/webp">/,
  );
  assert.match(invitation, /\bdata-introdove="1"/);
  assert.match(invitation, /<picture\b[^>]*\bintro-picture\b/i);
  assert.match(invitation, /LBS02087-mobile-640\.webp\s+640w/i);
  assert.match(invitation, /LBS02087-mobile-841\.webp\s+841w/i);
  assert.match(invitation, /\bintro-open-arrow\b/i);
  assert.match(invitation, /<b data-heroanim="1"[^>]*>07\.08\.2026<\/b>/);
  assert.match(invitation, /2026-08-07T11:00:00\+07:00/);
  assert.match(
    invitation,
    /\.\/assets\/audio\/wedding-01-francisco-alvear\.mp3/,
  );
  assert.match(invitation, /data-screen-label="04 Featured album"/);
  for (const basename of [
    "LBS02643",
    "LBS01523_1",
    "LBS01781",
    "LBS02261",
    "LBS02201",
  ]) {
    assert.match(
      invitation,
      new RegExp(`src="\\./assets/photos/${basename}-640\\.webp"`),
    );
  }
  assert.deepEqual(builtDove, sourceDove);
  assert.deepEqual(builtMobile640, sourceMobile640);
  assert.deepEqual(builtMobile841, sourceMobile841);
  assert.deepEqual(builtMusic, sourceMusic);
  assert.deepEqual(
    builtHandholding640,
    sourceHandholding640,
  );
  assert.deepEqual(
    builtHandholding1280,
    sourceHandholding1280,
  );
});
