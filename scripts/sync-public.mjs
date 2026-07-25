import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, ".site-public");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all([
  cp(resolve(root, "Thiep Cuoi 57 v2.dc.html"), resolve(output, "invitation.html")),
  cp(resolve(root, "support.js"), resolve(output, "support.js")),
  cp(resolve(root, "image-slot.js"), resolve(output, "image-slot.js")),
  cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true }),
]);

console.log("Wedding invitation assets prepared.");
