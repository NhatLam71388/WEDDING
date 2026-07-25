import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const INVITATION_PATH = "Thiep Cuoi 57 v2.dc.html";
const EXPECTED_PHOTOS = [
  "LBS01523_1",
  "LBS01554_1",
  "LBS01613",
  "LBS01634",
  "LBS01643",
  "LBS01674",
  "LBS01681",
  "LBS01690",
  "LBS01726",
  "LBS01781",
  "LBS01835",
  "LBS01852",
  "LBS01887",
  "LBS01919",
  "LBS01931",
  "LBS02087",
  "LBS02121",
  "LBS02178",
  "LBS02201",
  "LBS02261",
  "LBS02274",
  "LBS02333",
  "LBS02361",
  "LBS02386",
  "LBS02456",
  "LBS02474",
  "LBS02492",
  "LBS02533",
  "LBS02576",
  "LBS02643",
];
const WIDE_PHOTOS = new Set([
  "LBS02201",
  "LBS02261",
  "LBS02274",
  "LBS02386",
]);

function extractLogicScript(html) {
  const match = html.match(
    /<script\b[^>]*\btype="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/,
  );
  assert.ok(match, "invitation logic script should exist");
  return match[1];
}

function evaluateInvitation(html) {
  const script = extractLogicScript(html);
  return new Function(
    "DCLogic",
    "React",
    `${script}\nreturn { Logic: Component, photos: GALLERY_PHOTOS };`,
  )(
    class {},
    { createElement: () => null },
  );
}

function basenameOf(photo) {
  if (typeof photo === "string") return photo;
  for (const key of ["basename", "name", "id", "src", "fullSrc"]) {
    if (typeof photo?.[key] !== "string") continue;
    const match = photo[key].match(
      /(LBS\d+(?:_\d+)?)(?:-(?:640|1280))?(?:\.webp|\.jpg)?$/i,
    );
    if (match) return match[1];
  }
  return "";
}

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

function openingTags(source, tagName) {
  return source.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function cssBodiesMatching(source, selectorPattern) {
  const bodies = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of source.matchAll(rulePattern)) {
    if (selectorPattern.test(match[1])) bodies.push(match[2]);
  }
  return bodies;
}

function installSynchronousState(invitation) {
  invitation.setState = (update) => {
    const patch =
      typeof update === "function"
        ? update(invitation.state, invitation.props)
        : update;
    invitation.state = { ...invitation.state, ...patch };
  };
}

function functionEntry(object, pattern, description) {
  const entry = Object.entries(object).find(
    ([key, value]) => pattern.test(key) && typeof value === "function",
  );
  assert.ok(entry, description);
  return entry;
}

function photoOpenHandler(photo) {
  return functionEntry(
    photo,
    /(?:open|view|select|click)/i,
    "each gallery photo should expose a thumbnail-open handler",
  )[1];
}

function activeGalleryIndex(invitation) {
  if (invitation.state.galleryPhotoOpen === false) return null;
  const entry = Object.entries(invitation.state).find(
    ([key, value]) =>
      /(?:gallery|viewer|photo)/i.test(key) &&
      /(?:index|active|selected)/i.test(key) &&
      Number.isInteger(value) &&
      value >= 0,
  );
  return entry ? entry[1] : null;
}

function makeFocusable(attributes = {}) {
  return {
    attributes,
    focusCalls: 0,
    focusOptions: [],
    focus(options) {
      this.focusCalls += 1;
      this.focusOptions.push(options);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
  };
}

function touchEvent(x, y = 120) {
  const point = { clientX: x, clientY: y };
  return {
    clientX: x,
    clientY: y,
    touches: [point],
    changedTouches: [point],
    preventDefault() {},
  };
}

function simulateTwoColumnPacking(photos) {
  let occupiedColumn = 0;
  let holes = 0;
  for (const photo of photos) {
    const span = photo.layout === "wide" ? 2 : 1;
    if (span === 2) {
      if (occupiedColumn === 1) {
        holes += 1;
        occupiedColumn = 0;
      }
      continue;
    }
    occupiedColumn = occupiedColumn === 0 ? 1 : 0;
  }
  if (occupiedColumn === 1) holes += 1;
  return holes;
}

test("gallery manifest exactly mirrors all 30 source photos and variants", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const { photos } = evaluateInvitation(html);
  const manifestNames = photos.map(basenameOf);

  assert.equal(photos.length, 30, "gallery should expose all 30 source photos");
  assert.equal(
    new Set(manifestNames).size,
    manifestNames.length,
    "gallery manifest must not contain duplicate photos",
  );
  assert.deepEqual(
    manifestNames,
    EXPECTED_PHOTOS,
    "gallery manifest should follow the complete chronological source order",
  );

  await Promise.all(
    EXPECTED_PHOTOS.flatMap((basename) => [
      access(`assets/photos/${basename}-640.webp`),
      access(`assets/photos/${basename}-1280.webp`),
    ]),
  );

  for (const photo of photos) {
    const basename = basenameOf(photo);
    assert.equal(
      photo.src,
      `./assets/photos/${basename}-640.webp`,
      `${basename} thumbnail should use its 640px derivative`,
    );
    assert.equal(
      photo.fullSrc,
      `./assets/photos/${basename}-1280.webp`,
      `${basename} viewer should use its 1280px derivative`,
    );
    assert.ok(
      photo.layout === "portrait" || photo.layout === "wide",
      `${basename} should declare an explicit portrait/wide layout`,
    );
  }

  const actualWide = new Set(
    photos
      .filter((photo) => photo.layout === "wide")
      .map((photo) => basenameOf(photo)),
  );
  assert.deepEqual(
    [...actualWide].sort(),
    [...WIDE_PHOTOS].sort(),
    "only the four agreed editorial frames should span both grid columns",
  );

  assert.doesNotMatch(html, /\b25\s+ảnh\b/i);
  assert.ok(
    (html.match(/\{\{\s*galleryCount\s*\}\}/g) ?? []).length >= 2,
    "album CTA and gallery header should both derive their count",
  );
  assert.match(
    extractLogicScript(html),
    /\bgalleryCount\s*:\s*GALLERY_PHOTOS\.length\b/,
  );
});

test("gallery uses explicit, interactive layouts that pack without holes", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const { photos } = evaluateInvitation(html);
  const grid = between(
    html,
    '<div class="gallery-grid"',
    "</sc-for>",
  );
  const button = openingTags(grid, "button")[0];

  assert.ok(button, "gallery thumbnails should be real buttons");
  assert.match(button, /\btype="button"/i);
  assert.match(
    button,
    /\bdata-gallery-layout="\{\{\s*photo\.layout\s*\}\}"/i,
  );
  assert.match(
    button,
    /\bonClick="\{\{\s*(?:photo\.[^}]+|openGalleryPhoto)\s*\}\}"/i,
  );
  assert.match(button, /\baria-label="\{\{\s*photo\.[^}]+\s*\}\}"/i);
  assert.match(grid, /<img\b[^>]*\bloading="lazy"/i);
  assert.match(grid, /<img\b[^>]*\bdecoding="async"/i);

  assert.doesNotMatch(
    html,
    /\.gallery-grid[^{}]*:nth-child\s*\(/i,
    "layout must follow photo metadata instead of list position",
  );
  const gridBodies = cssBodiesMatching(html, /\.gallery-grid\b/i);
  assert.ok(gridBodies.length > 0, "gallery grid CSS should exist");
  assert.doesNotMatch(
    gridBodies.join("\n"),
    /\bgrid-auto-flow\s*:\s*dense\b/i,
    "dense packing would make visual and keyboard order disagree",
  );
  const wideBodies = cssBodiesMatching(
    html,
    /\[data-gallery-layout\s*=\s*["']wide["']\]/i,
  );
  assert.ok(
    wideBodies.some((body) => /\bgrid-column\s*:\s*1\s*\/\s*-1\b/i.test(body)),
    "wide metadata should span the complete two-column row",
  );

  assert.equal(
    simulateTwoColumnPacking(photos),
    0,
    "the declared chronological layout should leave no incomplete grid row",
  );
});

test("full viewer uses uncropped 1280px photos and accessible controls", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const viewerMarker = html.match(
    /<[^>]+\b(?:data-gallery-?viewer|data-gallery-?lightbox)(?:="[^"]*")?[^>]*>/i,
  );
  assert.ok(viewerMarker, "a full-photo gallery viewer should exist");
  const viewer = html.slice(
    viewerMarker.index,
    Math.min(html.length, viewerMarker.index + 7000),
  );
  const viewerImage = openingTags(viewer, "img")[0];

  assert.ok(viewerImage, "viewer should render the active full photo");
  assert.match(
    viewerImage,
    /\bsrc="\{\{\s*(?:[^"]*fullSrc|galleryPhotoSrc)\s*\}\}"/i,
  );
  assert.match(
    viewerImage,
    /\balt="\{\{\s*(?:[^"]+\.alt|galleryPhotoAlt)\s*\}\}"/i,
  );
  assert.doesNotMatch(viewerImage, /\bdata-zoom\b/i);
  assert.match(viewer, /\baria-label="(?:Ảnh trước|Xem ảnh trước)"/i);
  assert.match(
    viewer,
    /\baria-label="(?:Ảnh sau|Xem ảnh (?:sau|tiếp theo))"/i,
  );
  assert.match(
    viewer,
    /\baria-label="Đóng (?:ảnh|trình xem ảnh|viewer)[^"]*"/i,
  );
  assert.match(
    extractLogicScript(html),
    /\bgalleryPhotoSrc\s*:\s*galleryPhoto\.fullSrc\b/,
    "viewer binding should resolve to the active 1280px manifest source",
  );

  const containBodies = cssBodiesMatching(
    html,
    /gallery[^,{]*(?:viewer|lightbox)[^,{]*(?:img|image|photo)/i,
  ).filter((body) => /\bobject-fit\s*:\s*contain\b/i.test(body));
  assert.ok(
    containBodies.length > 0,
    "the full viewer image should use object-fit: contain",
  );
  assert.doesNotMatch(
    containBodies.join("\n"),
    /\bobject-fit\s*:\s*cover\b|\btransform\s*:[^;]*scale\(/i,
    "viewer must not crop or zoom the full photo",
  );
});

test("viewer navigation, Escape hierarchy, swipe threshold, and focus restore work", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const script = extractLogicScript(html);
  const { Logic } = evaluateInvitation(html);
  const thresholdMatch = script.match(
    /\bGALLERY_SWIPE_THRESHOLD\s*=\s*(\d+(?:\.\d+)?)/,
  );
  assert.ok(thresholdMatch, "gallery swipe should use a named threshold");
  const swipeThreshold = Number(thresholdMatch[1]);
  assert.ok(
    swipeThreshold >= 40 && swipeThreshold <= 80,
    "swipe threshold should reject taps while remaining reachable",
  );

  const invitation = new Logic();
  installSynchronousState(invitation);
  invitation.state = {
    ...invitation.state,
    introOn: false,
    galleryOpen: false,
  };
  invitation.props = {};
  invitation.unmounted = false;
  invitation.prepareReveal = () => {};
  invitation.setupClock = () => {};
  invitation.setupScroll = () => {};
  invitation.setupSectionNav = () => {};
  invitation.setupButtons = () => {};
  invitation.prepareMusic = () => {};
  invitation.loadMessages = () => {};
  invitation.startInvitationMotion = () => {};

  const galleryTrigger = makeFocusable();
  const thumbnailTrigger = makeFocusable({ "data-gallery-index": "0" });
  const galleryClose = makeFocusable();
  const viewerClose = makeFocusable();
  const documentListeners = new Map();
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousSetInterval = globalThis.setInterval;
  const previousClearInterval = globalThis.clearInterval;

  globalThis.document = {
    activeElement: galleryTrigger,
    hidden: false,
    body: { style: { overflow: "" } },
    querySelectorAll: () => [],
    querySelector: (selector) => {
      if (/(?:viewer|lightbox)/i.test(selector)) return viewerClose;
      if (/data-galleryroot/i.test(selector)) return galleryClose;
      if (/data-invite-shell/i.test(selector)) return makeFocusable();
      return null;
    },
    addEventListener: (type, listener) =>
      documentListeners.set(type, listener),
    removeEventListener: (type, listener) => {
      if (documentListeners.get(type) === listener) {
        documentListeners.delete(type);
      }
    },
  };
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.setInterval = () => 1;
  globalThis.clearInterval = () => {};

  try {
    invitation.componentDidMount();
    const initialValues = invitation.renderVals();
    assert.equal(typeof initialValues.openGallery, "function");
    initialValues.openGallery({ currentTarget: galleryTrigger });
    invitation.componentDidUpdate();
    assert.equal(invitation.state.galleryOpen, true);
    assert.equal(document.body.style.overflow, "hidden");
    assert.ok(galleryClose.focusCalls > 0, "gallery should focus its close control");

    const renderedGallery = invitation.renderVals();
    const openFirst =
      typeof renderedGallery.openGalleryPhoto === "function"
        ? renderedGallery.openGalleryPhoto
        : photoOpenHandler(renderedGallery.galleryPhotos[0]);
    openFirst({ currentTarget: thumbnailTrigger });
    invitation.componentDidUpdate();
    assert.equal(activeGalleryIndex(invitation), 0);
    assert.ok(viewerClose.focusCalls > 0, "viewer should focus its close control");

    const openValues = invitation.renderVals();
    const next = functionEntry(
      openValues,
      /(?:next|forward).*(?:gallery|photo|image)|(?:gallery|photo|image).*next/i,
      "viewer should expose next-photo navigation",
    )[1];
    const previous = functionEntry(
      openValues,
      /(?:prev|previous|back).*(?:gallery|photo|image)|(?:gallery|photo|image).*(?:prev|previous)/i,
      "viewer should expose previous-photo navigation",
    )[1];
    next();
    assert.equal(activeGalleryIndex(invitation), 1);
    previous();
    assert.equal(activeGalleryIndex(invitation), 0);

    const keydown = documentListeners.get("keydown") ?? invitation.onKey;
    assert.equal(typeof keydown, "function", "gallery should bind keyboard controls");
    keydown({ key: "ArrowRight", preventDefault() {} });
    assert.equal(activeGalleryIndex(invitation), 1);
    keydown({ key: "ArrowLeft", preventDefault() {} });
    assert.equal(activeGalleryIndex(invitation), 0);

    const swipeValues = invitation.renderVals();
    const swipeStart = functionEntry(
      swipeValues,
      /(?:begin|start).*(?:swipe|touch|pointer)|(?:swipe|touch|pointer).*(?:begin|start|down)/i,
      "viewer should expose swipe-start handling",
    )[1];
    const swipeEnd = functionEntry(
      swipeValues,
      /(?:end|finish).*(?:swipe|touch|pointer)|(?:swipe|touch|pointer).*(?:end|finish|up)/i,
      "viewer should expose swipe-end handling",
    )[1];
    swipeStart(touchEvent(220));
    swipeEnd(touchEvent(220 - swipeThreshold + 1));
    assert.equal(
      activeGalleryIndex(invitation),
      0,
      "movement below the swipe threshold should not change photos",
    );
    swipeStart(touchEvent(220));
    swipeEnd(touchEvent(220 - swipeThreshold - 1));
    assert.equal(
      activeGalleryIndex(invitation),
      1,
      "a left swipe beyond the threshold should show the next photo",
    );

    keydown({ key: "Escape", preventDefault() {} });
    invitation.componentDidUpdate();
    assert.equal(activeGalleryIndex(invitation), null);
    assert.equal(
      invitation.state.galleryOpen,
      true,
      "first Escape should close only the full viewer",
    );
    assert.equal(
      document.body.style.overflow,
      "hidden",
      "closing the viewer must keep the open gallery scroll lock",
    );
    assert.ok(
      thumbnailTrigger.focusCalls > 0,
      "closing the viewer should restore its thumbnail focus",
    );

    keydown({ key: "Escape", preventDefault() {} });
    invitation.componentDidUpdate();
    assert.equal(invitation.state.galleryOpen, false);
    assert.equal(document.body.style.overflow, "");
    assert.ok(
      galleryTrigger.focusCalls > 0,
      "closing the gallery should restore its opener focus",
    );
  } finally {
    try {
      invitation.componentWillUnmount();
    } catch {
      // The focused contract is already asserted above; tolerate partial mocks.
    }
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    globalThis.setInterval = previousSetInterval;
    globalThis.clearInterval = previousClearInterval;
  }
});
