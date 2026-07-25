import assert from "node:assert/strict";

// The invitation markup is periodically run through an HTML/CSS formatter, which
// wraps tag attributes across lines, indents text nodes, self-closes void
// elements and pads CSS declarations. Every helper here exists so the assertions
// in tests/*.test.mjs can describe what the markup *means* rather than how it
// happens to be line-wrapped today.

// Collapses whitespace at tag boundaries so `<section\n  id="x"\n>\n  text\n</section>`
// compares equal to `<section id="x">text</section>`. Entities are deliberately
// left alone so assertions about escaped attribute payloads keep working.
export function normalize(source) {
  return source
    .replace(/\s+/g, " ")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .replace(/\s+>/g, ">");
}

// Strips all whitespace, for asserting on CSS rules whose declarations the
// formatter pads (`display:none!important` vs `display: none !important;`).
// Only safe for values without significant spaces.
export function squeezeCss(source) {
  return source.replace(/\s+/g, "");
}

export function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

// Matches a void element by its attributes regardless of their order, the
// formatter's line wrapping, or whether it self-closes.
export function voidTag(name, attributes) {
  const lookaheads = Object.entries(attributes)
    .map(([key, value]) => {
      const literal = String(value).replaceAll(
        /[.*+?^${}()|[\]\\/]/g,
        "\\$&",
      );
      return `(?=[^>]*\\b${key}="${literal}")`;
    })
    .join("");
  return new RegExp(`<${name}\\b${lookaheads}[^>]*>`);
}

// Font stacks appear as raw CSS (") and inside escaped style attributes
// (&quot;), so accept either quoting style. Passing a selector scopes the match
// to that rule so a size cannot silently drift onto a different element.
export function playfairFont(size, selector = "") {
  const quote = `(?:'|"|&quot;)`;
  const scope = selector
    ? `${selector.replaceAll(".", "\\.")}\\s*\\{[^}]*`
    : "";
  return new RegExp(
    `${scope}font:\\s*italic 400 ${size.replaceAll(".", "\\.")}\\s*` +
      `${quote}Playfair Display${quote},\\s*serif`,
  );
}

// data-props holds JSON inside an attribute, so its inner quotes are either
// escaped or raw depending on which quote character wraps the attribute.
export function jsonPropDefault(prop, value) {
  const quote = `(?:"|&quot;)`;
  const literal = value.replaceAll(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(
    `${quote}${prop}${quote}:[\\s\\S]*?` +
      `${quote}default${quote}:\\s*${quote}${literal}${quote}`,
  );
}

// The DivCoder logic block; tolerant of wrapped attributes on the script tag.
export const LOGIC_SCRIPT_PATTERN =
  /<script\b[^>]*\btype="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/;
