import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const INVITATION_PATH = "Thiep Cuoi 57 v2.dc.html";
const REQUIRED_IMAGES = [
  {
    basename: "LBS02643",
    role: "groom portrait",
    alt: /(?:chú rể|Ngô Nam)/i,
  },
  {
    basename: "LBS01523_1",
    role: "bride portrait",
    alt: /(?:cô dâu|Nhật Mai)/i,
  },
  {
    basename: "LBS02261",
    role: "first handholding landscape",
    alt: /(?:nắm tay|dắt tay).*(?:Ngô Nam|Nhật Mai)|(?:Ngô Nam|Nhật Mai).*(?:nắm tay|dắt tay)/i,
  },
  {
    basename: "LBS02201",
    role: "second handholding landscape",
    alt: /(?:nắm tay|dắt tay).*(?:Ngô Nam|Nhật Mai)|(?:Ngô Nam|Nhật Mai).*(?:nắm tay|dắt tay)/i,
  },
  {
    basename: "LBS01781",
    role: "full-subject princess twirl",
    alt: /(?:xoay váy|váy.*công chúa|công chúa.*váy)/i,
  },
];

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

function sectionTag(source, label) {
  const tag = openingTags(source, "section").find((candidate) =>
    new RegExp(`\\bdata-screen-label="${label}"`, "i").test(candidate),
  );
  assert.ok(tag, `${label} section should exist`);
  return tag;
}

function tagWithClass(source, tagName, className) {
  return openingTags(source, tagName).find((tag) =>
    new RegExp(`\\bclass="[^"]*\\b${className}\\b[^"]*"`, "i").test(tag),
  );
}

function elements(source, tagName) {
  return (
    source.match(
      new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi"),
    ) ?? []
  );
}

function elementsWithClass(source, tagName, className) {
  return elements(source, tagName).filter((element) =>
    new RegExp(
      `<${tagName}\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"`,
      "i",
    ).test(element),
  );
}

function cssRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "i"));
  assert.ok(match, `${selector} CSS rule should exist`);
  return match[1];
}

function storySection(source) {
  const end = tagWithClass(source, "div", "love-marquee");
  assert.ok(end, "story section should end before the love marquee");
  return between(source, sectionTag(source, "03 Our story"), end);
}

function assertResponsiveImage(tag, basename, altPattern) {
  assert.match(
    tag,
    new RegExp(`\\bsrc="\\./assets/photos/${basename}-640\\.webp"`, "i"),
  );
  assert.match(
    tag,
    new RegExp(
      `\\bsrcset="[^"]*${basename}-640\\.webp\\s+640w[^"]*${basename}-1280\\.webp\\s+1280w[^"]*"`,
      "i",
    ),
  );
  const sizes = tag.match(/\bsizes="([^"]+)"/i);
  assert.ok(sizes, `${basename} should declare responsive sizes`);
  assert.match(sizes[1], /\bmax-width\b/i);
  assert.match(sizes[1], /\d+(?:\.\d+)?vw\b/i);
  assert.match(sizes[1], /\d+(?:\.\d+)?px\b/i);
  assert.match(tag, /\balt="([^"]+)"/i);
  assert.match(tag.match(/\balt="([^"]+)"/i)[1], altPattern);
  assert.match(tag, /\bloading="lazy"/i);
  assert.match(tag, /\bdecoding="async"/i);
  assert.match(tag, /\bwidth="\d+"/i);
  assert.match(tag, /\bheight="\d+"/i);
  assert.doesNotMatch(tag, /\b(?:hidden|aria-hidden="true")\b/i);
}

test("story and featured album show the five requested image roles", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  await Promise.all(
    REQUIRED_IMAGES.flatMap(({ basename }) => [
      access(`assets/photos/${basename}-640.webp`),
      access(`assets/photos/${basename}-1280.webp`),
    ]),
  );

  const story = storySection(html);
  const featuredStart = sectionTag(html, "04 Featured album");
  assert.match(featuredStart, /\bid="album"/i);
  const featured = between(
    html,
    featuredStart,
    sectionTag(html, "05 Quote"),
  );
  const combined = story + featured;
  const images = openingTags(combined, "img");

  assert.equal(
    images.length,
    5,
    "story and featured sections should contain two portraits, two handholding landscapes, and one princess frame",
  );

  for (const { basename, role, alt } of REQUIRED_IMAGES) {
    const matches = images.filter((tag) =>
      new RegExp(`\\bsrc="[^"]*${basename}-640\\.webp"`, "i").test(tag),
    );
    assert.equal(matches.length, 1, `${role} should appear visibly once`);
    assertResponsiveImage(matches[0], basename, alt);
  }

  assert.equal(openingTags(story, "img").length, 2);
  assert.equal(openingTags(featured, "img").length, 3);
  assert.match(story, /LBS02643-640\.webp/);
  assert.match(story, /LBS01523_1-640\.webp/);
  assert.doesNotMatch(story, /LBS01781|LBS02261|LBS02201/);
  assert.match(featured, /LBS02261-640\.webp/);
  assert.match(featured, /LBS01781-640\.webp/);
  assert.match(featured, /LBS02201-640\.webp/);
  assert.doesNotMatch(featured, /LBS02643|LBS01523_1/);

  assert.doesNotMatch(
    combined,
    /LBS01726|LBS02274|LBS02361|LBS02576/,
    "old curated photos must not remain in the featured sections",
  );
});

test("the two handholding landscapes form a stacked editorial story", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const story = storySection(html);
  const featured = between(
    html,
    sectionTag(html, "04 Featured album"),
    sectionTag(html, "05 Quote"),
  );

  const storyStage = tagWithClass(story, "div", "story-stage");
  assert.ok(storyStage);
  assert.match(storyStage, /\bclass="[^"]*\bportrait-pair\b[^"]*"/i);
  assert.ok(tagWithClass(story, "figure", "story-frame--groom"));
  assert.ok(tagWithClass(story, "figure", "story-frame--bride"));

  assert.ok(tagWithClass(featured, "div", "featured-stage"));
  assert.ok(tagWithClass(featured, "div", "featured-handholding-pair"));
  const handholdingFrames = elementsWithClass(
    featured,
    "figure",
    "featured-frame--handholding",
  );
  assert.equal(
    handholdingFrames.length,
    2,
    "the two landscape images should be presented as one matched pair",
  );
  const firstHandholdingFrame = handholdingFrames.find((frame) =>
    /LBS02261-640\.webp/i.test(frame),
  );
  const secondHandholdingFrame = handholdingFrames.find((frame) =>
    /LBS02201-640\.webp/i.test(frame),
  );
  assert.ok(firstHandholdingFrame);
  assert.ok(secondHandholdingFrame);
  assert.match(
    firstHandholdingFrame,
    /\bclass="[^"]*\bfeatured-frame--handholding-first\b[^"]*"/i,
  );
  assert.match(
    secondHandholdingFrame,
    /\bclass="[^"]*\bfeatured-frame--handholding-second\b[^"]*"/i,
  );

  const twirlFrame = tagWithClass(
    featured,
    "figure",
    "featured-frame--twirl",
  );
  assert.ok(twirlFrame);
  assert.match(twirlFrame, /\bclass="[^"]*\bfull-subject\b[^"]*"/i);

  assert.doesNotMatch(
    html,
    /editorial-(?:story|main|inset)|curated-(?:stage|card|wide|tall|round|note)/,
  );

  const storyStageRule = cssRule(html, ".story-stage");
  assert.match(
    storyStageRule,
    /\bheight\s*:\s*(?:clamp\(|min\(|max\(|\d+(?:\.\d+)?(?:px|svh|vh|vw))/i,
    "the portrait story keeps its bounded composition",
  );
  const featuredStageRule = cssRule(html, ".featured-stage");
  assert.match(featuredStageRule, /\bheight\s*:\s*auto\b/i);
  assert.match(featuredStageRule, /\bpadding-top\s*:\s*clamp\(/i);
  assert.doesNotMatch(featuredStageRule, /\bmin-height\s*:/i);

  const storyFrameRule = cssRule(html, ".story-frame");
  assert.match(storyFrameRule, /\baspect-ratio\s*:\s*2\s*\/\s*3/i);

  const handholdingRule = cssRule(html, ".featured-frame--handholding");
  assert.match(handholdingRule, /\bwidth\s*:\s*100%/i);
  const photoWindowRule = cssRule(html, ".handholding-photo-window");
  assert.match(photoWindowRule, /\baspect-ratio\s*:\s*1280\s*\/\s*854/i);
  const handholdingImageRule = cssRule(
    html,
    ".featured-frame--handholding img",
  );
  assert.match(handholdingImageRule, /\bobject-fit\s*:\s*contain/i);

  const firstFrameRule = cssRule(
    html,
    ".featured-frame--handholding-first",
  );
  const secondFrameRule = cssRule(
    html,
    ".featured-frame--handholding-second",
  );
  assert.match(firstFrameRule, /\bborder-radius\s*:\s*112px\s+112px/i);
  assert.match(secondFrameRule, /\brotate\s*:\s*\.65deg/i);
  assert.match(secondFrameRule, /\bwidth\s*:\s*100%/i);
  assert.doesNotMatch(
    secondFrameRule,
    /\bwidth\s*:\s*(?:9[0-9]|[1-8][0-9])%/i,
    "the second landscape should remain full-width on its own row",
  );

  const pairRule = cssRule(html, ".featured-handholding-pair");
  const isOneColumnGrid =
    /\bdisplay\s*:\s*grid\b/i.test(pairRule) &&
    /\bgrid-template-columns\s*:\s*(?:1fr|minmax\(\s*0\s*,\s*1fr\s*\)|repeat\(\s*1\s*,)/i.test(
      pairRule,
    );
  const isColumnFlex =
    /\bdisplay\s*:\s*flex\b/i.test(pairRule) &&
    /\bflex-direction\s*:\s*column\b/i.test(pairRule);
  assert.ok(
    isOneColumnGrid || isColumnFlex,
    "the handholding pair should stack in one column, one image per row",
  );
  assert.doesNotMatch(
    pairRule,
    /\bgrid-template-columns\s*:\s*repeat\(\s*2\b/i,
  );
  const twirlRule = cssRule(html, ".featured-frame--twirl");
  assert.match(twirlRule, /\baspect-ratio\s*:\s*2\s*\/\s*3/i);

  assert.match(
    html,
    /@media\s*\(max-width\s*:[^)]+\)[^{]*\{[\s\S]*?\.featured-handholding-pair/i,
    "the handholding pair should adapt at a mobile breakpoint",
  );
});

test("featured image frames have no overlaid captions or labels", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const featured = between(
    html,
    sectionTag(html, "04 Featured album"),
    sectionTag(html, "05 Quote"),
  );
  const imageFigures = elementsWithClass(featured, "figure", "featured-frame");

  assert.equal(imageFigures.length, 3);
  for (const figure of imageFigures) {
    assert.doesNotMatch(
      figure,
      /<figcaption\b/i,
      "featured image figures should remain visually clean",
    );
  }

  assert.doesNotMatch(
    featured,
    /\bclass="[^"]*\b(?:featured-label|handholding-caption)\b[^"]*"/i,
  );
  assert.doesNotMatch(
    html,
    /\.(?:featured-label|handholding-caption)\b/i,
    "obsolete overlay-caption selectors should be removed",
  );

  const editorial = tagWithClass(
    featured,
    "div",
    "handholding-editorial",
  );
  const bridge = tagWithClass(featured, "div", "handholding-bridge");
  assert.ok(editorial, "the editorial heading should sit outside the photos");
  assert.ok(bridge, "the handwritten sticker should sit between the photos");
  assert.match(bridge, /\baria-hidden="true"/i);
  for (const figure of imageFigures) {
    assert.doesNotMatch(figure, /handholding-(?:editorial|bridge)/i);
  }
});

test("the separate princess frame preserves the original full subject", async () => {
  const html = await readFile(INVITATION_PATH, "utf8");
  const featured = between(
    html,
    sectionTag(html, "04 Featured album"),
    sectionTag(html, "05 Quote"),
  );
  const images = openingTags(featured, "img");
  const twirl = images.find((tag) =>
    /\bsrc="\.\/assets\/photos\/LBS01781-640\.webp"/i.test(tag),
  );
  const firstLandscape = images.find((tag) =>
    tag.includes("LBS02261-640.webp"),
  );
  const secondLandscape = images.find((tag) =>
    tag.includes("LBS02201-640.webp"),
  );
  assert.ok(twirl);
  assert.ok(firstLandscape);
  assert.ok(secondLandscape);

  assert.doesNotMatch(twirl, /\bdata-zoom\b/i);
  assert.doesNotMatch(twirl, /\bstyle="[^"]*object-fit\s*:\s*cover/i);

  const fullSubjectRule =
    html.match(/\.full-subject\s+img\s*\{([^}]*)\}/i) ??
    html.match(/\.featured-frame--twirl\s+img\s*\{([^}]*)\}/i);
  assert.ok(fullSubjectRule, "twirl image should have a full-subject CSS rule");
  assert.match(fullSubjectRule[1], /\bobject-fit\s*:\s*contain/i);
  assert.doesNotMatch(
    fullSubjectRule[1],
    /\bobject-fit\s*:\s*cover/i,
  );

  const landscapeImageRule =
    html.match(/\.featured-frame--handholding\s+img\s*\{([^}]*)\}/i) ??
    html.match(/\.featured-frame\s+img\s*\{([^}]*)\}/i);
  assert.ok(
    landscapeImageRule,
    "both handholding landscapes should preserve the original composition",
  );
  assert.match(landscapeImageRule[1], /\bobject-fit\s*:\s*contain/i);
  assert.doesNotMatch(landscapeImageRule[1], /\bobject-fit\s*:\s*cover/i);
});
