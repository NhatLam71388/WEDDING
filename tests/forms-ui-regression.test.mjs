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
    '<section data-screen-label="09 Wishes"',
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

test("wishes paginate, remain compact, and visibly pin the submitted wish", async () => {
  const { html, Logic } = await loadInvitation();
  const wishes = between(
    normalize(html),
    '<section data-screen-label="09 Wishes"',
    '<section data-screen-label="10 Gift"',
  );

  assert.match(wishes, /onLoadMoreMessages/);
  assert.match(html, /Xem thêm 12 lời chúc/);
  assert.match(wishes, />Thu gọn</);
  assert.match(wishes, />Lời chúc của bạn</);
  assert.match(wishes, /data-wish-id="\{\{\s*w\.id\s*\}\}"/);
  assert.match(html, /MESSAGE_PAGE_SIZE\s*=\s*12/);
  assert.match(html, /messagesNextCursor/);
  assert.match(html, /this\.mergeMessages\(/);

  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const sessionStorage = memoryStorage();
  globalThis.window = {
    location: { hostname: "localhost" },
    localStorage: memoryStorage(),
    sessionStorage,
  };
  const submittedMessage = {
    id: "123e4567-e89b-42d3-a456-426614174001",
    name: "Khách kiểm thử",
    body: "Chúc hai bạn trăm năm hạnh phúc!",
    createdAt: "2026-07-25T10:00:00.000Z",
  };
  globalThis.fetch = async (_url, options = {}) => ({
    ok: true,
    json: async () =>
      options.method === "GET"
        ? { messages: [submittedMessage], nextCursor: null, hasMore: false }
        : { success: true, message: submittedMessage },
  });

  try {
    const invitation = new Logic();
    installStateUpdates(invitation);
    invitation.unmounted = false;
    invitation.state = {
      ...invitation.state,
      wName: "Khách kiểm thử",
      wText: "Chúc hai bạn trăm năm hạnh phúc!",
    };

    await invitation.addWish();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(invitation.state.wishSent, true);
    assert.equal(invitation.state.wishes.length, 1);
    assert.equal(invitation.state.wishes[0].isOwn, true);
    assert.equal(invitation.state.wishes[0].cardClass, "wish-card is-mine");
    assert.equal(
      invitation.state.lastSubmittedMessageId,
      invitation.state.wishes[0].id,
    );
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
