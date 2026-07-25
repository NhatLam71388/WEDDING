import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel serves the static invitation and keeps admin on the backend", async () => {
  const [configSource, invitation, publicInvitation, sourceDove, publicDove] =
    await Promise.all([
      readFile("vercel.json", "utf8"),
      readFile("Thiep Cuoi 57 v2.dc.html", "utf8"),
      readFile(".site-public/invitation.html", "utf8"),
      readFile("assets/decor/dove-flight.webp"),
      readFile(".site-public/assets/decor/dove-flight.webp"),
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
    (invitation.match(/fetch\(this\.apiUrl\('\/api\//g) ?? []).length,
    3,
  );
  assert.match(publicInvitation, /\bdata-introdove="1"/);
  assert.match(
    publicInvitation,
    /<link rel="preload" as="image" href="\.\/assets\/decor\/dove-flight\.webp" type="image\/webp">/,
  );
  assert.deepEqual(publicDove, sourceDove);
});
