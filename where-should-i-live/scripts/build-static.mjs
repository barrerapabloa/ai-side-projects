#!/usr/bin/env node
/**
 * Stash app/api (not allowed with output: "export"), run static build, restore.
 * GitHub Actions uses `rm -rf src/app/api` instead (ephemeral runner).
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const apiDir = join(root, "src/app/api");
/** Must stay outside `src/app` or Next will treat it as routes. */
const stashPath = join(root, ".api-stash-for-pages");

function moveApiAside() {
  if (existsSync(stashPath)) rmSync(stashPath, { recursive: true });
  if (existsSync(apiDir)) renameSync(apiDir, stashPath);
}

function restoreApi() {
  if (existsSync(apiDir)) return;
  if (existsSync(stashPath)) renameSync(stashPath, apiDir);
}

moveApiAside();
const r = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
  shell: true,
});
restoreApi();
process.exit(r.status ?? 1);
