import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function loadInvitation() {
  const html = await readFile("Thiep Cuoi 57 v2.dc.html", "utf8");
  const match = html.match(
    /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/,
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

  return { html, Logic };
}

function createIntroFixture(Logic, { reduced }) {
  const animations = [];
  const makeNode = (name) => {
    const classes = new Set();
    const attributes = new Map();

    return {
      name,
      style: {},
      attributes,
      classList: {
        add: (...values) => values.forEach((value) => classes.add(value)),
        contains: (value) => classes.has(value),
      },
      setAttribute: (key, value) => attributes.set(key, value),
      animate: (keyframes, options) => {
        animations.push({ name, keyframes, options });
        return {};
      },
    };
  };

  const root = makeNode("root");
  const card = makeNode("card");
  const left = makeNode("left curtain");
  const right = makeNode("right curtain");
  const button = makeNode("open button");
  const heroes = [makeNode("hero one"), makeNode("hero two")];
  const nodes = new Map([
    ["[data-introroot]", root],
    ["[data-introcard]", card],
    ['[data-curtain="left"]', left],
    ['[data-curtain="right"]', right],
    ["[data-intro-open]", button],
  ]);

  const invitation = new Logic();
  invitation.reduced = reduced;
  invitation.introOpening = false;
  invitation._bodyOverflowBeforeMount = "";
  invitation._scrollWasLocked = true;
  invitation._wasGift = false;
  invitation._wasGallery = false;
  invitation.setState = (update) => {
    const patch =
      typeof update === "function" ? update(invitation.state) : update;
    invitation.state = { ...invitation.state, ...patch };
    invitation.componentDidUpdate();
  };

  return {
    animations,
    button,
    heroes,
    invitation,
    document: {
      body: { style: { overflow: "hidden" } },
      querySelector: (selector) => nodes.get(selector) ?? null,
      querySelectorAll: (selector) =>
        selector === "[data-heroanim]" ? heroes : [],
    },
    root,
  };
}

test("intro preloads its artwork and exposes accessible interaction hooks", async () => {
  const { html } = await loadInvitation();
  await access("assets/decor/dove-flight.webp");

  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const dovePreload = linkTags.find((tag) =>
    tag.includes('href="./assets/decor/dove-flight.webp"'),
  );
  assert.ok(dovePreload, "dove artwork should be preloaded");
  assert.match(dovePreload, /\brel="preload"/);
  assert.match(dovePreload, /\bas="image"/);
  assert.match(dovePreload, /\btype="image\/webp"/);

  const doveTags =
    html.match(/<img\b[^>]*\bdata-introdove="[^"]+"[^>]*>/gi) ?? [];
  assert.equal(doveTags.length, 3, "the intro should render three flying doves");
  for (const tag of doveTags) {
    assert.match(tag, /\bsrc="\.\/assets\/decor\/dove-flight\.webp"/);
    assert.match(tag, /\balt=""/);
    assert.match(tag, /\baria-hidden="true"/);
    assert.match(tag, /\bdraggable="false"/);
  }

  assert.match(
    html,
    /<div\b[^>]*data-introroot="1"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="intro-title"/,
  );
  assert.match(
    html,
    /<button\b[^>]*data-intro-open="1"[^>]*type="button"[^>]*aria-label="Mở thiệp cưới"/,
  );
  assert.match(
    html,
    /@media\s*\(prefers-reduced-motion:reduce\)[\s\S]*?\.intro-dove-layer,.intro-dust\{display:none!important\}/,
  );
});

test("opening animation is idempotent and keeps scroll locked until it finishes", async () => {
  const { Logic } = await loadInvitation();
  const fixture = createIntroFixture(Logic, { reduced: false });
  const scheduled = [];
  const previousDocument = globalThis.document;
  const previousSetTimeout = globalThis.setTimeout;

  globalThis.document = fixture.document;
  globalThis.setTimeout = (callback, delay) => {
    scheduled.push({ callback, delay });
    return scheduled.length;
  };

  try {
    fixture.invitation.openInvite();

    assert.equal(fixture.invitation.introOpening, true);
    assert.equal(document.body.style.overflow, "hidden");
    assert.equal(fixture.invitation.state.introOn, true);
    assert.equal(fixture.animations.length, 3);
    assert.deepEqual(
      scheduled.map(({ delay }) => delay),
      [520, 1580],
    );
    assert.equal(fixture.root.classList.contains("is-opening"), true);
    assert.equal(fixture.button.attributes.get("aria-busy"), "true");
    assert.equal(fixture.button.attributes.get("aria-disabled"), "true");

    fixture.invitation.openInvite();
    assert.equal(
      fixture.animations.length,
      3,
      "a second click must not restart curtain animations",
    );
    assert.equal(
      scheduled.length,
      2,
      "a second click must not create duplicate timers",
    );
    assert.equal(document.body.style.overflow, "hidden");

    scheduled.find(({ delay }) => delay === 520).callback();
    assert.equal(fixture.invitation.state.introOn, true);
    assert.equal(document.body.style.overflow, "hidden");
    for (const hero of fixture.heroes) {
      assert.equal(hero.style.animationPlayState, "running");
    }

    scheduled.find(({ delay }) => delay === 1580).callback();
    assert.equal(fixture.invitation.state.introOn, false);
    assert.equal(document.body.style.overflow, "");
    assert.equal(fixture.invitation._scrollWasLocked, false);
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
    globalThis.setTimeout = previousSetTimeout;
  }
});

test("reduced motion skips Web Animations and timers before unlocking", async () => {
  const { Logic } = await loadInvitation();
  const fixture = createIntroFixture(Logic, { reduced: true });
  let timerCalls = 0;
  const previousDocument = globalThis.document;
  const previousSetTimeout = globalThis.setTimeout;

  globalThis.document = fixture.document;
  globalThis.setTimeout = () => {
    timerCalls += 1;
    return timerCalls;
  };

  try {
    fixture.invitation.openInvite();

    assert.equal(fixture.invitation.state.introOn, false);
    assert.equal(fixture.invitation.introOpening, true);
    assert.equal(fixture.animations.length, 0);
    assert.equal(timerCalls, 0);
    assert.equal(document.body.style.overflow, "");
    for (const hero of fixture.heroes) {
      assert.equal(hero.style.animationPlayState, "running");
    }

    fixture.invitation.openInvite();
    assert.equal(fixture.animations.length, 0);
    assert.equal(timerCalls, 0);
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
    globalThis.setTimeout = previousSetTimeout;
  }
});

test("missing Web Animations support falls back without trapping the guest", async () => {
  const { Logic } = await loadInvitation();
  const fixture = createIntroFixture(Logic, { reduced: false });
  fixture.document.querySelector("[data-introcard]").animate = undefined;
  let timerCalls = 0;
  const previousDocument = globalThis.document;
  const previousSetTimeout = globalThis.setTimeout;

  globalThis.document = fixture.document;
  globalThis.setTimeout = () => {
    timerCalls += 1;
    return timerCalls;
  };

  try {
    fixture.invitation.openInvite();

    assert.equal(fixture.invitation.state.introOn, false);
    assert.equal(document.body.style.overflow, "");
    assert.equal(fixture.animations.length, 0);
    assert.equal(timerCalls, 0);
    for (const hero of fixture.heroes) {
      assert.equal(hero.style.animationPlayState, "running");
    }
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
    globalThis.setTimeout = previousSetTimeout;
  }
});
