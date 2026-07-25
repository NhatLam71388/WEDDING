import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const INVITATION_PATH = "Thiep Cuoi 57 v2.dc.html";
const MUSIC_PATH = "./assets/audio/wedding-01-francisco-alvear.mp3";

async function loadInvitation() {
  const html = await readFile(INVITATION_PATH, "utf8");
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

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

function makeButton() {
  const attributes = new Map();
  const classes = new Set();
  const icon = { style: {} };
  const ring = { style: {} };
  return {
    attributes,
    style: {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle: (name, force) => {
        if (force === undefined ? !classes.has(name) : force) classes.add(name);
        else classes.delete(name);
        return classes.has(name);
      },
      contains: (name) => classes.has(name),
    },
    icon,
    ring,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => attributes.get(name),
    querySelector: (selector) =>
      selector === "[data-musicring]" ? ring : icon,
  };
}

function installStateUpdates(invitation) {
  invitation.setState = (update) => {
    const patch =
      typeof update === "function" ? update(invitation.state) : update;
    invitation.state = { ...invitation.state, ...patch };
  };
}

async function settleToggle(result) {
  await Promise.resolve(result);
  await Promise.resolve();
}

test("bride-family celebration is the canonical invitation date", async () => {
  const [html, admin, readme] = await Promise.all([
    readFile(INVITATION_PATH, "utf8"),
    readFile("app/admin/AdminDashboard.tsx", "utf8"),
    readFile("README.md", "utf8"),
  ]);

  const hero = between(
    html,
    '<section data-screen-label="01 Hero"',
    '<nav class="invite-nav"',
  );
  assert.match(hero, /THỨ SÁU · 07\.08\.2026/);
  assert.doesNotMatch(hero, /THỨ BẢY · 08\.08\.2026/);

  const story = between(
    html,
    '<section data-screen-label="03 Our story"',
    '<div class="love-marquee"',
  );
  assert.match(story, /class="date-seal">07 · 08<br>2026</);

  const marquee = between(
    html,
    '<div class="love-marquee"',
    '<section id="album"',
  );
  assert.equal(
    (marquee.match(/NGÔ NAM · NHẬT MAI · 07\.08\.2026/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(marquee, /08\.08\.2026/);

  const events = between(
    html,
    '<section id="events"',
    '<section data-screen-label="07 Countdown"',
  );
  const brideEvent = between(
    events,
    '<div class="event-chip">Tiệc cưới nhà gái</div>',
    '<div class="event-chip">Lễ thành hôn · Nhà trai</div>',
  );
  assert.match(brideEvent, />07\.08\.2026</);
  assert.match(brideEvent, />Thứ sáu · 11:00</);
  assert.match(brideEvent, />Nhằm ngày 25 tháng 06 năm Bính Ngọ</);

  const groomEvent = events.slice(
    events.indexOf('<div class="event-chip">Lễ thành hôn · Nhà trai</div>'),
  );
  assert.match(groomEvent, />08\.08\.2026</);
  assert.match(groomEvent, />Thứ bảy · 11:00</);

  const countdown = between(
    html,
    '<section data-screen-label="07 Countdown"',
    '<section id="rsvp"',
  );
  assert.match(countdown, />11:00 · 07\.08\.2026</);

  const finalInvitation = between(
    html,
    '<section data-screen-label="11 Final invitation"',
    "<footer ",
  );
  assert.match(
    finalInvitation,
    /font:italic 400 36px\/1\.1 'Playfair Display',serif[^>]*>07\.08\.2026</,
  );

  const intro = between(html, '<div data-introroot="1"', "</sc-if>");
  assert.match(
    intro,
    /<div class="intro-date"><span>Thứ sáu<\/span><b>07 · 08 · 2026<\/b><\/div>/,
  );

  assert.match(
    html,
    /this\.t1 = this\.target\('2026-08-07T11:00:00\+07:00'\)/,
  );
  assert.equal(
    Date.parse("2026-08-07T11:00:00+07:00"),
    1786075200000,
  );

  assert.match(admin, /admin-art-date">07 · 08 · 2026</);
  assert.match(admin, /<small>07\.08\.2026<\/small>/);
  assert.match(readme, /07\/08\/2026/);
  assert.match(readme, /11:00/);
});

test("music control has a real default track and a safe bottom-left position", async () => {
  const { html } = await loadInvitation();
  await access("assets/audio/wedding-01-francisco-alvear.mp3");

  assert.match(
    html,
    /&quot;musicSrc&quot;:[\s\S]*?&quot;default&quot;:&quot;\.\/assets\/audio\/wedding-01-francisco-alvear\.mp3&quot;/,
  );

  const button = html.match(
    /<button\b(?=[^>]*data-music="1")(?=[^>]*aria-label="Phát nhạc nền")[^>]*>/i,
  );
  assert.ok(button, "music control should exist");
  assert.match(button[0], /\btype="button"/i);
  assert.match(button[0], /\baria-pressed="(?:false|\{\{[^}]+\}\})"/i);

  const style =
    button[0].match(/\bstyle="([^"]*)"/i)?.[1] ??
    html.match(/\.music-control\s*\{([^}]*)\}/i)?.[1];
  assert.ok(style, "music control should expose its fixed positioning");
  assert.match(style, /\bposition\s*:\s*fixed/i);
  assert.match(
    style,
    /\bbottom\s*:\s*max\([^;]*env\(safe-area-inset-bottom\)[^;]*\)/i,
  );
  assert.match(style, /\bleft\s*:\s*max\(/i);
  assert.doesNotMatch(style, /\b(?:top|right)\s*:/i);
});

test("music state follows successful play, pause, and rejected playback", async () => {
  const { Logic } = await loadInvitation();
  const previousAudio = globalThis.Audio;
  const audioInstances = [];

  class MockAudio {
    static rejectPlay = false;

    constructor(src) {
      this.src = src;
      this.loop = false;
      this.volume = 1;
      this.playCalls = 0;
      this.pauseCalls = 0;
      this.listeners = new Map();
      audioInstances.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    removeEventListener(type, listener) {
      if (this.listeners.get(type) === listener) this.listeners.delete(type);
    }

    emit(type) {
      const listener = this.listeners.get(type);
      if (listener) listener();
    }

    play() {
      this.playCalls += 1;
      if (MockAudio.rejectPlay) {
        return Promise.reject(new Error("playback blocked"));
      }
      return Promise.resolve();
    }

    pause() {
      this.pauseCalls += 1;
    }
  }

  globalThis.Audio = MockAudio;

  try {
    const invitation = new Logic();
    invitation.props = { musicSrc: MUSIC_PATH };
    invitation.reduced = false;
    invitation.unmounted = false;
    installStateUpdates(invitation);
    const button = makeButton();

    await settleToggle(invitation.toggleMusic(button));
    assert.equal(audioInstances.length, 1);
    assert.equal(audioInstances[0].src, MUSIC_PATH);
    assert.equal(audioInstances[0].loop, true);
    assert.ok(
      audioInstances[0].volume > 0 && audioInstances[0].volume <= 1,
      "background music should use an audible, valid volume",
    );
    assert.equal(audioInstances[0].playCalls, 1);
    assert.equal(invitation.state.playing, true);
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(button.getAttribute("aria-label"), "Tạm dừng nhạc nền");
    assert.equal(button.classList.contains("is-unavailable"), false);

    await settleToggle(invitation.toggleMusic(button));
    assert.equal(audioInstances[0].pauseCalls, 1);
    assert.equal(invitation.state.playing, false);
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(button.getAttribute("aria-label"), "Phát nhạc nền");

    const rejected = new Logic();
    rejected.props = { musicSrc: MUSIC_PATH };
    rejected.reduced = false;
    rejected.unmounted = false;
    installStateUpdates(rejected);
    const rejectedButton = makeButton();
    MockAudio.rejectPlay = true;

    await settleToggle(rejected.toggleMusic(rejectedButton));
    assert.equal(rejected.state.playing, false);
    assert.equal(rejectedButton.getAttribute("aria-pressed"), "false");
    assert.equal(rejectedButton.getAttribute("aria-label"), "Phát nhạc nền");
    assert.equal(rejectedButton.classList.contains("is-unavailable"), true);
  } finally {
    if (previousAudio === undefined) {
      delete globalThis.Audio;
    } else {
      globalThis.Audio = previousAudio;
    }
  }
});
