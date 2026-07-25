import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production admin is visual, responsive, and downloads real Excel safely", async () => {
  const source = await readFile("worker/admin-page.ts", "utf8");

  assert.match(source, /Tải Excel \(\.xlsx\)/);
  assert.match(source, /Tải CSV \(\.csv\)/);
  assert.match(source, /format=xlsx/);
  assert.match(source, /format=csv/);
  assert.match(
    source,
    /href="https:\/\/ngo-nam-nhat-mai-wedding\.vercel\.app\/"/,
  );
  assert.match(source, /id="attendanceDonut"/);
  assert.match(source, /id="groomBar"/);
  assert.match(source, /id="visibleBar"/);
  assert.match(source, /id="rsvpSearch"/);
  assert.match(source, /id="rsvpSide"/);
  assert.match(source, /id="rsvpAttend"/);
  assert.match(source, /id="messageSearch"/);
  assert.match(source, /id="messageVisibility"/);
  assert.match(
    source,
    /<section class="insights" tabindex="0"[\s\S]*aria-describedby="insightsHelp"/,
  );
  assert.match(source, /aria-label="Làm mới dữ liệu"/);
  assert.match(source, /aria-label="Đăng xuất quản trị"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /<table>/);
  assert.match(source, /<th scope="col">/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /prefers-reduced-motion/);
  assert.doesNotMatch(source, /max-height:\s*650px|overflow-y:\s*auto/);

  for (const unsafe of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "innerHTML",
    "outerHTML",
    "insertAdjacentHTML",
    "document.write",
    "eval(",
  ]) {
    assert.doesNotMatch(source, new RegExp(unsafe.replace("(", "\\(")));
  }

  const appendIndex = source.indexOf("document.body.appendChild(anchor)");
  const clickIndex = source.indexOf("anchor.click()", appendIndex);
  const removeIndex = source.indexOf("anchor.remove()", clickIndex);
  const revokeIndex = source.indexOf("URL.revokeObjectURL(url)", removeIndex);
  assert.ok(appendIndex > 0);
  assert.ok(clickIndex > appendIndex);
  assert.ok(removeIndex > clickIndex);
  assert.ok(revokeIndex > removeIndex);
  assert.match(
    source.slice(removeIndex, revokeIndex + 30),
    /setTimeout\(\(\) => URL\.revokeObjectURL/,
  );
  assert.match(
    source,
    /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
  );
  assert.match(source, /blob\.size < 4/);
  assert.match(
    source,
    /signature\[0\] !== 0x50[\s\S]*signature\[3\] !== 0x04/,
  );
  assert.match(source, /finally \{[\s\S]*anchor\.remove\(\)/);
  assert.match(source, /\$\("key"\)\.value = ""/);
  assert.match(source, /\$\("key"\)\.type = "password"/);
  assert.doesNotMatch(source, /tải toàn bộ dữ liệu/);

  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /default-src 'none'/);
  assert.match(source, /connect-src 'self'/);
  assert.match(source, /frame-ancestors 'none'/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /no-store/);

  const clientScript = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(clientScript, "embedded admin client script must exist");
  assert.doesNotThrow(() => new Function(clientScript));
});
