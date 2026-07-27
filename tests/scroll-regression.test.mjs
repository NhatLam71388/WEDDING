import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("closing the gallery always releases the page scroll lock", async () => {
  const html = await readFile("Thiep Cuoi 57 v2.dc.html", "utf8");
  const match = html.match(
    /<script\b[^>]*\btype="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/,
  );
  assert.ok(match, "invitation logic script should exist");

  const Logic = new Function(
    "DCLogic",
    "React",
    `${match[1]}\nreturn Component;`,
  )(
    class {},
    { createElement: () => null },
  );

  const previousDocument = globalThis.document;
  globalThis.document = {
    body: { style: { overflow: "" } },
    querySelector: () => null,
  };

  try {
    const invitation = new Logic();
    invitation._wasGallery = false;
    invitation._scrollWasLocked = false;
    invitation._bodyOverflowBeforeMount = "";
    invitation.state.introOn = false;

    invitation.state.galleryOpen = true;
    invitation.componentDidUpdate();
    assert.equal(document.body.style.overflow, "hidden");

    invitation.state.galleryOpen = false;
    invitation.componentDidUpdate();
    assert.equal(document.body.style.overflow, "");
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
  }
});

test("public image slots permit page pan and do not keep a wheel listener", async () => {
  const source = await readFile("image-slot.js", "utf8");

  assert.match(source, /touch-action:pan-y pinch-zoom/);
  assert.match(
    source,
    /:host\(\[data-reframe\]\) \.frame img\{touch-action:none\}/,
  );
  assert.match(
    source,
    /_enterReframe\(\)[\s\S]*addEventListener\('wheel', this\._wheelZoom/,
  );
  assert.match(
    source,
    /_exitReframe\(commit\)[\s\S]*removeEventListener\('wheel', this\._wheelZoom\)/,
  );
});
