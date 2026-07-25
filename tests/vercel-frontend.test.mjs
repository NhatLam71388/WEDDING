import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel serves the static invitation and keeps admin on the backend", async () => {
  const [
    configSource,
    invitation,
    publicInvitation,
    sourceDove,
    publicDove,
    sourceMobile640,
    publicMobile640,
    sourceMobile841,
    publicMobile841,
    sourceMusic,
    publicMusic,
    sourceHandholding640,
    publicHandholding640,
    sourceHandholding1280,
    publicHandholding1280,
  ] = await Promise.all([
    readFile("vercel.json", "utf8"),
    readFile("Thiep Cuoi 57 v2.dc.html", "utf8"),
    readFile(".site-public/invitation.html", "utf8"),
    readFile("assets/decor/dove-flight.webp"),
    readFile(".site-public/assets/decor/dove-flight.webp"),
    readFile("assets/photos/LBS02087-mobile-640.webp"),
    readFile(".site-public/assets/photos/LBS02087-mobile-640.webp"),
    readFile("assets/photos/LBS02087-mobile-841.webp"),
    readFile(".site-public/assets/photos/LBS02087-mobile-841.webp"),
    readFile("assets/audio/wedding-01-francisco-alvear.mp3"),
    readFile(".site-public/assets/audio/wedding-01-francisco-alvear.mp3"),
    readFile("assets/photos/LBS02261-640.webp"),
    readFile(".site-public/assets/photos/LBS02261-640.webp"),
    readFile("assets/photos/LBS02261-1280.webp"),
    readFile(".site-public/assets/photos/LBS02261-1280.webp"),
  ]);
  const config = JSON.parse(configSource);

  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, ".site-public");
  assert.deepEqual(config.rewrites[0], {
    source: "/",
    destination: "/invitation.html",
  });
  assert.match(config.redirects[0].destination, /chatgpt\.site\/admin$/);
  assert.match(
    invitation,
    /host\.endsWith\('\.vercel\.app'\)[\s\S]*?ngo-nam-nhat-mai-wedding\.vanhung71388\.chatgpt\.site/,
  );
  assert.equal(
    (invitation.match(/fetch\(this\.apiUrl\(/g) ?? []).length,
    3,
  );
  assert.match(publicInvitation, /\bdata-introdove="1"/);
  assert.match(
    publicInvitation,
    /<link rel="preload" as="image" href="\.\/assets\/decor\/dove-flight\.webp" type="image\/webp">/,
  );
  assert.match(publicInvitation, /<picture\b[^>]*\bintro-picture\b/i);
  assert.match(publicInvitation, /LBS02087-mobile-640\.webp\s+640w/i);
  assert.match(publicInvitation, /LBS02087-mobile-841\.webp\s+841w/i);
  assert.match(publicInvitation, /\bintro-open-arrow\b/i);
  assert.match(publicInvitation, /<b data-heroanim="1"[^>]*>07\.08\.2026<\/b>/);
  assert.match(publicInvitation, /2026-08-07T11:00:00\+07:00/);
  assert.match(
    publicInvitation,
    /\.\/assets\/audio\/wedding-01-francisco-alvear\.mp3/,
  );
  assert.match(publicInvitation, /data-screen-label="04 Featured album"/);
  for (const basename of [
    "LBS02643",
    "LBS01523_1",
    "LBS01781",
    "LBS02261",
    "LBS02201",
  ]) {
    assert.match(
      publicInvitation,
      new RegExp(`src="\\./assets/photos/${basename}-640\\.webp"`),
    );
  }
  assert.deepEqual(publicDove, sourceDove);
  assert.deepEqual(publicMobile640, sourceMobile640);
  assert.deepEqual(publicMobile841, sourceMobile841);
  assert.deepEqual(publicMusic, sourceMusic);
  assert.deepEqual(
    publicHandholding640,
    sourceHandholding640,
  );
  assert.deepEqual(
    publicHandholding1280,
    sourceHandholding1280,
  );
});
