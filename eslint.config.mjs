import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores(["dist/**", ".next/**", ".site-public/**", "support.js", "image-slot.js"]),
]);
