import assert from "node:assert/strict";

import { LOGIC_SCRIPT_PATTERN, squeezeCss } from "./html-normalize.mjs";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const MOBILE_INTRO_ASSETS = [
  "assets/photos/LBS02087-mobile-640.webp",
  "assets/photos/LBS02087-mobile-841.webp",
];

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

async function readWebpDimensions(path) {
  const buffer = await readFile(path);
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF", `${path} must be RIFF`);
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP", `${path} must be WebP`);

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (type === "VP8X" && size >= 10) {
      return {
        width: readUint24LE(buffer, dataOffset + 4) + 1,
        height: readUint24LE(buffer, dataOffset + 7) + 1,
      };
    }

    if (type === "VP8L" && size >= 5 && buffer[dataOffset] === 0x2f) {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }

    if (
      type === "VP8 " &&
      size >= 10 &&
      buffer[dataOffset + 3] === 0x9d &&
      buffer[dataOffset + 4] === 0x01 &&
      buffer[dataOffset + 5] === 0x2a
    ) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    offset = dataOffset + size + (size % 2);
  }

  assert.fail(`Could not read dimensions from ${path}`);
}

async function loadInvitation() {
  const html = await readFile("Thiep Cuoi 57 v2.dc.html", "utf8");
  const match = html.match(LOGIC_SCRIPT_PATTERN);
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

function findTag(html, tagName, requiredText) {
  return (html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? []).find(
    (tag) => tag.includes(requiredText),
  );
}

function keyframesSection(html, name) {
  const start = html.search(new RegExp(`@keyframes\\s+${name}\\b`, "i"));
  assert.notEqual(start, -1, `${name} keyframes should exist`);
  const next = html.slice(start + 1).search(/@keyframes\s+/i);
  const end = next === -1 ? html.indexOf("</style>", start) : start + 1 + next;
  return html.slice(start, end);
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
  invitation._introWasOn = true;
  invitation._wasGift = false;
  invitation._wasGallery = false;
  invitation.startMusicFromGesture = () => {};
  const motionCalls = [];
  invitation.startInvitationMotion = () => {
    if (invitation.motionStarted) return;
    invitation.motionStarted = true;
    invitation.heroStarted = true;
    invitation.revealStarted = true;
    motionCalls.push("started");
    heroes.forEach((hero) => {
      hero.style.animationPlayState = "running";
    });
  };
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
    motionCalls,
    document: {
      body: { style: { overflow: "hidden" } },
      querySelector: (selector) => nodes.get(selector) ?? null,
      querySelectorAll: (selector) =>
        selector === "[data-heroanim]" ? heroes : [],
    },
    root,
  };
}

test("intro art-directs expanded mobile photos without zooming the reveal", async () => {
  const { html } = await loadInvitation();
  const dimensions = await Promise.all(
    MOBILE_INTRO_ASSETS.map((path) => readWebpDimensions(path)),
  );

  for (const [index, { width, height }] of dimensions.entries()) {
    assert.ok(width > 0 && height > 0);
    assert.ok(
      height / width >= 2,
      `${MOBILE_INTRO_ASSETS[index]} should be expanded to a phone aspect ratio`,
    );
  }

  const picture = html.match(
    /<picture\b[^>]*class="[^"]*\bintro-picture\b[^"]*"[^>]*>([\s\S]*?)<\/picture>/i,
  );
  assert.ok(picture, "intro photo should use a responsive picture element");

  const mobileSource = findTag(picture[1], "source", "LBS02087-mobile-");
  assert.ok(mobileSource, "picture should provide an expanded mobile source");
  assert.match(
    mobileSource,
    /\bmedia="\(\s*max-width\s*:\s*620px\s*\)\s+and\s+\(\s*orientation\s*:\s*portrait\s*\)"/i,
  );
  assert.match(mobileSource, /LBS02087-mobile-640\.webp\s+640w/i);
  assert.match(mobileSource, /LBS02087-mobile-841\.webp\s+841w/i);
  assert.match(mobileSource, /\btype="image\/webp"/i);

  const desktopFallback = findTag(picture[1], "img", "intro-photo");
  assert.ok(desktopFallback, "picture should retain an img fallback");
  assert.match(desktopFallback, /\bsrc="\.\/assets\/photos\/LBS02087-1280\.webp"/i);
  assert.match(
    desktopFallback,
    /LBS02087-640\.webp\s+640w[\s\S]*LBS02087-1280\.webp\s+1280w/i,
  );

  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const mobilePreload = linkTags.find((tag) =>
    tag.includes("LBS02087-mobile-"),
  );
  assert.ok(mobilePreload, "expanded mobile intro should be preloaded");
  assert.match(mobilePreload, /\brel="preload"/i);
  assert.match(mobilePreload, /\bas="image"/i);
  assert.match(
    mobilePreload,
    /\bmedia="\(\s*max-width\s*:\s*620px\s*\)\s+and\s+\(\s*orientation\s*:\s*portrait\s*\)"/i,
  );
  assert.match(mobilePreload, /LBS02087-mobile-640\.webp\s+640w/i);
  assert.match(mobilePreload, /LBS02087-mobile-841\.webp\s+841w/i);

  const desktopPreload = linkTags.find(
    (tag) =>
      tag.includes('href="./assets/photos/LBS02087-1280.webp"') &&
      !tag.includes("LBS02087-mobile-"),
  );
  assert.ok(desktopPreload, "desktop intro should retain its own preload");
  assert.match(
    desktopPreload,
    /\bmedia="[^"]*(?:min-width\s*:\s*621px|orientation\s*:\s*landscape)[^"]*"/i,
  );

  assert.doesNotMatch(
    keyframesSection(html, "introPhotoReveal"),
    /\b(?:transform\s*:[^;}]*scale\s*\(|scale\s*:)/i,
    "intro reveal must not zoom the photo to hide an aspect-ratio mismatch",
  );
});

test("intro open control is an animated accessible pill", async () => {
  const { html } = await loadInvitation();
  const button = html.match(
    /(<button\b(?=[^>]*data-intro-open="1")(?=[^>]*class="[^"]*\bintro-open-button\b)[^>]*>)([\s\S]*?)<\/button>/i,
  );
  assert.ok(button, "intro should render the pill open button");
  assert.match(button[1], /\btype="button"/i);
  assert.match(button[1], /\baria-label="Mở thiệp cưới"/i);
  assert.match(button[2], /class="[^"]*\bintro-open-icon\b[^"]*"/i);
  assert.match(button[2], /class="[^"]*\bintro-open-label\b[^"]*"/i);
  assert.match(
    button[2],
    /class="[^"]*\bintro-open-arrow\b[^"]*"[^>]*aria-hidden="true"/i,
  );
  assert.doesNotMatch(button[2], /<br\b/i, "pill label should remain on one line");

  const buttonRule = html.match(/\.intro-open-button\s*\{([^}]*)\}/i);
  assert.ok(buttonRule, "intro pill should have a base CSS rule");
  assert.match(buttonRule[1], /\bborder-radius\s*:\s*999px\b/i);
  assert.match(
    buttonRule[1],
    /(?:\bmin-width\s*:|\bpadding\s*:\s*[^;]*\s+\d)/i,
    "pill should have horizontal room for its label and arrow",
  );

  const animationNames = [
    "introButtonFloat",
    "introButtonHalo",
    "introButtonSheen",
    "introSealHeartbeat",
    "introArrowNudge",
    "introButtonPress",
  ];
  for (const name of animationNames) {
    assert.match(html, new RegExp(`@keyframes\\s+${name}\\b`, "i"));
    assert.match(
      html,
      new RegExp(`animation(?:-name)?\\s*:[^;}]*\\b${name}\\b`, "i"),
      `${name} should be applied to the pill or one of its layers`,
    );
  }

  assert.match(html, /\.intro-open-button:active\s*\{[^}]+\}/i);
  assert.match(html, /\.intro-open-button:focus-visible\s*\{[^}]+\}/i);

  const reducedMotionStart = html.search(
    /@media\s*\(prefers-reduced-motion\s*:\s*reduce\)/i,
  );
  assert.notEqual(reducedMotionStart, -1);
  const reducedMotion = html.slice(
    reducedMotionStart,
    html.indexOf("</style>", reducedMotionStart),
  );
  assert.match(
    reducedMotion,
    /\.intro-open-button[\s\S]*?\{[^}]*animation\s*:\s*none\s*!important/i,
  );
  assert.match(reducedMotion, /\.intro-open-arrow/i);
});

test("invitation motion is prepared on mount and starts once at the intro close edge", async () => {
  const { html, Logic } = await loadInvitation();
  assert.match(html, /\bprepareReveal\s*\(\)/);
  assert.match(html, /\bactivateReveal\s*\(\)/);
  assert.match(html, /\bstartInvitationMotion\s*\(\)/);
  assert.doesNotMatch(html, /\bheroStartTimer\b/);

  const mountSection = html.slice(
    html.indexOf("componentDidMount()"),
    html.indexOf("componentWillUnmount()"),
  );
  assert.match(mountSection, /\bthis\.prepareReveal\s*\(\)/);
  assert.doesNotMatch(mountSection, /\bthis\.activateReveal\s*\(\)/);
  assert.doesNotMatch(mountSection, /\bthis\.sparkle\s*\(\)/);

  const heroes = [{ style: {} }, { style: {} }];
  const invitation = new Logic();
  let revealCalls = 0;
  let sparkleCalls = 0;
  invitation.motionStarted = false;
  invitation.heroStarted = false;
  invitation.revealStarted = false;
  invitation.activateReveal = () => {
    invitation.revealStarted = true;
    revealCalls += 1;
  };
  invitation.sparkle = () => {
    sparkleCalls += 1;
  };

  const previousDocument = globalThis.document;
  globalThis.document = {
    querySelectorAll: (selector) =>
      selector === "[data-heroanim]" ? heroes : [],
  };

  try {
    invitation.startInvitationMotion();
    invitation.startInvitationMotion();

    assert.equal(invitation.motionStarted, true);
    assert.equal(invitation.heroStarted, true);
    assert.equal(invitation.revealStarted, true);
    assert.equal(revealCalls, 1);
    assert.equal(sparkleCalls, 1);
    for (const hero of heroes) {
      assert.equal(hero.style.animationPlayState, "running");
    }
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
  }
});

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
    squeezeCss(html),
    /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.intro-dove-layer,\.intro-dust\{display:none!important/,
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
    assert.deepEqual(scheduled.map(({ delay }) => delay), [1580]);
    assert.equal(fixture.motionCalls.length, 0);
    for (const hero of fixture.heroes) {
      assert.notEqual(hero.style.animationPlayState, "running");
    }
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
      1,
      "a second click must not create duplicate timers",
    );
    assert.equal(document.body.style.overflow, "hidden");

    scheduled.find(({ delay }) => delay === 1580).callback();
    assert.equal(fixture.invitation.state.introOn, false);
    assert.equal(document.body.style.overflow, "");
    assert.equal(fixture.invitation._scrollWasLocked, false);
    assert.equal(fixture.motionCalls.length, 1);
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
    assert.equal(fixture.motionCalls.length, 1);
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
    assert.equal(fixture.motionCalls.length, 1);
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
