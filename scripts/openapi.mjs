#!/usr/bin/env bun
// OpenAPI-first contract: exports the app's /doc to openapi/openapi.json and
// generates the typed client into openapi/client with @hey-api/openapi-ts.
// --check regenerates into a temp dir and fails when the committed files
// differ, so a route change missing from the spec fails CI.
//
// Usage: make openapi | make spec-diff (runs from the repo root)

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const specName = "openapi.json";
const clientName = "client";

function fail(message) {
  console.error(`openapi: ${message}`);
  process.exit(1);
}

// The committed spec always carries the default app name and version, so a
// developer's .env cannot make the check fail.
async function exportSpec(outDir) {
  delete process.env.APP_NAME;
  delete process.env.APP_VERSION;
  const { createApp } = await import("../src/app.js");
  const res = await createApp().request("/doc");
  if (!res.ok) {
    fail(`GET /doc answered ${res.status}`);
  }
  const spec = await res.json();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, specName), `${JSON.stringify(spec, null, 2)}\n`);
}

// @hey-api/openapi-ts needs the classic TypeScript compiler API, which the
// repo's TypeScript 7 no longer ships. Link the lockfile-pinned typescript5
// alias where the generator resolves its 'typescript' peer. Drop this when the
// generator supports TypeScript 7.
function linkClassicTypescript() {
  const nested = join(root, "node_modules", "@hey-api", "openapi-ts", "node_modules");
  const link = join(nested, "typescript");
  const target = join(root, "node_modules", "typescript5");
  if (!existsSync(target)) {
    fail("node_modules/typescript5 is missing; run make setup first");
  }
  if (existsSync(link)) return;
  mkdirSync(nested, { recursive: true });
  symlinkSync(target, link, "junction");
}

function generateClient(specPath, clientDir) {
  linkClassicTypescript();
  const bin = join(root, "node_modules", "@hey-api", "openapi-ts", "bin", "run.js");
  const result = spawnSync(
    "node",
    [
      bin,
      "--input",
      specPath,
      "--output",
      clientDir,
      "--client",
      "@hey-api/client-fetch",
      "--no-log-file",
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) {
    fail(`client generation failed with exit code ${result.status ?? "signal"}`);
  }
}

function allFiles(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        found.push(relative(dir, full));
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return found.sort();
}

async function main() {
  const check = process.argv.includes("--check");
  const outDir = check ? mkdtempSync(join(tmpdir(), "openapi-check-")) : join(root, "openapi");
  await exportSpec(outDir);
  generateClient(join(outDir, specName), join(outDir, clientName));

  if (!check) {
    console.log("openapi: spec and client written to openapi/");
    return;
  }
  const committed = join(root, "openapi");
  const fresh = new Set(allFiles(outDir));
  const old = new Set(allFiles(committed));
  const differing = [...fresh, ...old].filter((file) => {
    if (!fresh.has(file) || !old.has(file)) return true;
    return !readFileSync(join(outDir, file)).equals(readFileSync(join(committed, file)));
  });
  if (differing.length > 0) {
    fail(
      `committed OpenAPI files differ: ${[...new Set(differing)].sort().join(", ")}. Run make openapi.`,
    );
  }
  console.log("openapi: committed spec and client match the routes");
}

await main();
