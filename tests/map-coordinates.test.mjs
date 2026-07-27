import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("wedding direction buttons use the exact family coordinates", async () => {
  const html = await readFile("Thiep Cuoi 57 v2.dc.html", "utf8");

  assert.match(
    html,
    /Tiệc cưới nhà gái[\s\S]*?destination=12\.7941667%2C107\.9155833[\s\S]*?aria-label="Xem chỉ đường đến tư gia nhà gái trên Google Maps"/,
  );
  assert.match(
    html,
    /Lễ thành hôn · Nhà trai[\s\S]*?destination=12\.795142%2C107\.913681[\s\S]*?aria-label="Xem chỉ đường đến nơi tổ chức lễ nhà trai trên Google Maps"/,
  );
  assert.doesNotMatch(html, /maps\/search\/\?api=1&query=/);
});
