#!/usr/bin/env node
// License gate: every package reachable from production dependencies must carry
// a permissive licence. Banned or unknown licences fail. LGPL, MPL and EPL fail
// unless the owner records an exception in EXCEPTIONS below. Dev-only packages
// are exempt. Rewrites NOTICE from the direct production dependencies.
//
// Usage: make licenses (runs from the repo root)

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const nodeModules = join(root, "node_modules");

// Owner exceptions for weak-copyleft licences: package name -> reason.
// Record the date and the owner decision; keep this list empty when possible.
const EXCEPTIONS = {};

const BANNED = [
  /\baffero\b/i,
  /\bagpl\b/i,
  /(?<!l)GPL/i,
  /\bsspl\b/i,
  /\beupl\b/i,
  /\bcc-by-sa\b/i,
  /general public license/i,
];
const NEEDS_EXCEPTION = [
  /\blgpl\b/i,
  /\bmpl\b/i,
  /\bepl\b/i,
  /lesser general/i,
  /mozilla public/i,
  /eclipse public/i,
];

function fail(message) {
  console.error(`licenses: ${message}`);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

// All installed packages: top level plus nested node_modules (Bun nests on
// version conflicts), as parent directory -> Map(name -> manifest).
function installedPackages() {
  const scopes = new Map();
  const scan = (dir) => {
    const found = new Map();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || !entry.isDirectory()) continue;
      if (entry.name.startsWith("@")) {
        for (const sub of readdirSync(join(dir, entry.name), { withFileTypes: true })) {
          if (!sub.isDirectory()) continue;
          const manifest = join(dir, entry.name, sub.name, "package.json");
          if (existsSync(manifest)) {
            found.set(`${entry.name}/${sub.name}`, readJson(manifest));
          }
        }
        continue;
      }
      const manifest = join(dir, entry.name, "package.json");
      if (existsSync(manifest)) {
        found.set(entry.name, readJson(manifest));
      }
    }
    return found;
  };
  scopes.set(nodeModules, scan(nodeModules));
  const pending = [nodeModules];
  while (pending.length > 0) {
    const parent = pending.pop();
    for (const name of scopes.get(parent).keys()) {
      const nested = join(parent, name, "node_modules");
      if (existsSync(nested) && !scopes.has(nested)) {
        scopes.set(nested, scan(nested));
        pending.push(nested);
      }
    }
  }
  return scopes;
}

// Resolves a dependency edge from one installed package: its own nested scope
// first, then the top level. Returns the manifest path, or null when missing.
function resolveEdge(scopes, fromManifestPath, name) {
  const nested = join(dirname(fromManifestPath), "node_modules", name, "package.json");
  if (existsSync(nested)) return nested;
  const top = join(nodeModules, name, "package.json");
  if (existsSync(top)) return top;
  for (const [dir, pkgs] of scopes) {
    if (dir !== nodeModules && pkgs.has(name)) {
      return join(dir, name, "package.json");
    }
  }
  return null;
}

// Manifest paths reachable from production dependencies, following runtime edges.
function reachableFrom(scopes, roots) {
  const seen = new Set();
  const queue = roots
    .map((name) => join(nodeModules, name, "package.json"))
    .filter((manifest) => existsSync(manifest));
  while (queue.length > 0) {
    const manifestPath = queue.pop();
    if (seen.has(manifestPath)) continue;
    seen.add(manifestPath);
    const manifest = readJson(manifestPath);
    const edges = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    };
    for (const next of Object.keys(edges)) {
      const hit = resolveEdge(scopes, manifestPath, next);
      if (hit && !seen.has(hit)) queue.push(hit);
    }
  }
  return seen;
}

function licenseOf(manifest) {
  if (typeof manifest.license === "string") return manifest.license;
  if (manifest.license?.type) return manifest.license.type;
  if (Array.isArray(manifest.licenses)) {
    return manifest.licenses.map((entry) => entry.type ?? entry).join(" OR ");
  }
  return "";
}

function classify(name, license) {
  if (!license || /^\s*(unlicensed|see license in)/i.test(license)) return "unknown";
  if (BANNED.some((pattern) => pattern.test(license))) return "banned";
  if (NEEDS_EXCEPTION.some((pattern) => pattern.test(license))) {
    return name in EXCEPTIONS ? "excepted" : "needs-exception";
  }
  return "ok";
}

function main() {
  if (!existsSync(nodeModules)) {
    fail("node_modules is missing; run make setup first");
    return;
  }
  const pkg = readJson(join(root, "package.json"));
  const scopes = installedPackages();
  const top = scopes.get(nodeModules);
  const direct = Object.keys(pkg.dependencies ?? {});
  for (const name of direct) {
    if (!top.has(name)) {
      fail(`${name} is a production dependency but is not installed; run make setup first`);
    }
  }
  const reachable = reachableFrom(scopes, direct);

  let checked = 0;
  for (const manifestPath of [...reachable].sort()) {
    const manifest = readJson(manifestPath);
    const name = manifest.name;
    checked += 1;
    const license = licenseOf(manifest);
    const verdict = classify(name, license);
    if (verdict === "banned" || verdict === "unknown") {
      fail(`${name}@${manifest.version}: ${verdict} licence '${license || "missing"}'`);
    } else if (verdict === "needs-exception") {
      fail(
        `${name}@${manifest.version}: weak-copyleft licence '${license}' needs an owner exception in EXCEPTIONS`,
      );
    }
  }

  const notice = [
    "NOTICE",
    "",
    "Third-party licences for the direct production dependencies.",
    "Generated by make licenses; do not edit.",
    "",
    ...direct.sort().map((name) => {
      const manifest = top.get(name);
      const version = manifest?.version ?? "not installed";
      return `- ${name} ${version} (${manifest ? licenseOf(manifest) || "unknown" : "unknown"})`;
    }),
    "",
  ].join("\n");
  writeFileSync(join(root, "NOTICE"), notice);

  const total = [...scopes.values()].reduce((sum, pkgs) => sum + pkgs.size, 0);
  console.log(
    `licenses: ${checked} production packages checked, ${total - checked} dev-only exempt`,
  );
}

main();
