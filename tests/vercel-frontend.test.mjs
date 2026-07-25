import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel serves the static invitation and keeps admin on the backend", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const invitation = await readFile("Thiep Cuoi 57 v2.dc.html", "utf8");

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
});
