import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  between,
  LOGIC_SCRIPT_PATTERN,
  normalize,
} from "./html-normalize.mjs";

const INVITATION_PATH = "Thiep Cuoi 57 v2.dc.html";
const RESPONSE_ID = "rsvp_123e4567-e89b-42d3-a456-426614174000";

async function loadInvitation() {
  const html = await readFile(INVITATION_PATH, "utf8");
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


function installStateUpdates(invitation) {
  invitation.setState = (update, callback) => {
    const patch =
      typeof update === "function" ? update(invitation.state) : update;
    invitation.state = { ...invitation.state, ...patch };
    if (callback) callback();
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("RSVP keeps the form mounted and uses a device response id for updates", async () => {
  const { html, Logic } = await loadInvitation();
  const rsvp = between(
    normalize(html),
    '<section id="rsvp"',
    '<section data-screen-label="11 Final invitation"',
  );

  assert.match(rsvp, /id="v2-name"/);
  assert.match(rsvp, /class="rsvp-feedback-slot"/);
  assert.match(rsvp, /aria-live="polite"/);
  assert.match(rsvp, /Cập nhật xác nhận/);
  assert.match(rsvp, />Xác nhận cho khách khác</);
  assert.doesNotMatch(rsvp, /\{\{\s*rsvpOpen\s*\}\}/);
  assert.match(html, /RSVP_RESPONSE_STORAGE_KEY/);
  assert.match(html, /payload\.responseId\s*=\s*responseId/);

  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const requests = [];
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  globalThis.window = {
    location: { hostname: "localhost" },
    crypto: { randomUUID: () => RESPONSE_ID.slice(5) },
    localStorage,
    sessionStorage,
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        success: true,
        rsvp: {
          id: RESPONSE_ID,
          name: "Nguyễn Văn A",
          count: 2,
          attend: "yes",
          side: "bride",
          createdAt: new Date().toISOString(),
        },
      }),
    };
  };

  try {
    const invitation = new Logic();
    installStateUpdates(invitation);
    invitation.unmounted = false;
    invitation.state = {
      ...invitation.state,
      fName: "Nguyễn Văn A",
      fCount: "2",
      attend: "yes",
      side: "bride",
    };

    await invitation.submitRsvp();
    assert.equal(requests.length, 1);
    assert.equal(
      JSON.parse(requests[0].options.body).responseId,
      RESPONSE_ID,
    );
    assert.equal(invitation.state.rsvpSent, true);
    assert.equal(invitation.state.rsvpSavedOnce, true);
    assert.equal(invitation.renderVals().rsvpLabel, "Cập nhật xác nhận");

    invitation.renderVals().onCount({ target: { value: "3" } });
    assert.equal(invitation.state.rsvpSent, false);
    assert.equal(invitation.renderVals().rsvpLabel, "Cập nhật xác nhận");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = previousFetch;
  }
});

test("bride event uses a distinct, previously unfeatured áo dài portrait", async () => {
  const html = normalize(await readFile(INVITATION_PATH, "utf8"));
  const events = between(
    html,
    '<section id="events"',
    '<section data-screen-label="07 Countdown"',
  );
  const brideCard = between(
    events,
    '<article data-rv="left"',
    '<article data-rv="right"',
  );

  assert.match(brideCard, /LBS01919-640\.webp/);
  assert.match(brideCard, /LBS01919-1280\.webp/);
  assert.doesNotMatch(brideCard, /LBS02087/);
  assert.match(brideCard, /Nhật Mai trong áo dài trắng/);
});
