import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Cloudflare deploy targets the standalone API worker and production D1", async () => {
  const [configSource, packageSource, workflow, worker, adminPage] =
    await Promise.all([
      readFile("wrangler.api.jsonc", "utf8"),
      readFile("package.json", "utf8"),
      readFile(".github/workflows/deploy-cloudflare.yml", "utf8"),
      readFile("worker/api.ts", "utf8"),
      readFile("worker/admin-page.ts", "utf8"),
    ]);

  const config = JSON.parse(configSource);
  const packageJson = JSON.parse(packageSource);
  const database = config.d1_databases[0];

  assert.equal(config.name, "ngo-nam-nhat-mai-wedding-api");
  assert.equal(config.main, "./worker/api.ts");
  assert.equal(database.binding, "DB");
  assert.equal(database.database_name, "ngo-nam-nhat-mai-wedding");
  assert.match(
    database.database_id,
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i,
  );
  assert.notEqual(
    database.database_id,
    "00000000-0000-4000-8000-000000000000",
  );
  assert.equal(database.migrations_dir, "drizzle");

  for (const script of [
    "api:dev",
    "db:migrate:local",
    "db:migrate:remote",
    "deploy:worker",
  ]) {
    assert.match(packageJson.scripts[script], /wrangler\.api\.jsonc/);
  }

  assert.match(workflow, /branches:\s*\n\s*-\s*main/);
  assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(
    workflow,
    /CLOUDFLARE_ACCOUNT_ID:\s*e8045479a2ef8992d1258b748ac5f4c0/,
  );
  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /steps\.cloudflare\.outputs\.ready == 'true'/);
  assert.match(
    workflow,
    /Apply D1 migrations[\s\S]*Deploy Worker/,
  );

  assert.doesNotMatch(worker, /vinext|ASSETS|IMAGES/);
  assert.match(worker, /adminPageResponse/);
  assert.doesNotMatch(adminPage, /localStorage|sessionStorage/);
  assert.match(adminPage, /Content-Security-Policy/);
});
