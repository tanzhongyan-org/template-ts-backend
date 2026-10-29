#!/usr/bin/env node
// Security gate: a new-dependency check, a gitleaks secret scan and an
// osv-scanner dependency scan. Scanner binaries are reused from PATH when the
// pinned version is installed, otherwise downloaded checksum-verified from the
// GitHub release into node_modules/.cache (never committed).
//
// Usage: make security (the Makefile passes the pinned tool versions)

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const toolsDir = join(root, "node_modules", ".cache", "fleet-tools");
const MIN_AGE_DAYS = 14;

function fail(message) {
  console.error(`security: ${message}`);
  process.exitCode = 1;
}

async function fetchBytes(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`${url} answered ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// --- New-dependency check -------------------------------------------------

function baseRef() {
  for (const args of [
    ["merge-base", "HEAD", "origin/main"],
    ["rev-parse", "HEAD~1"],
  ]) {
    try {
      return execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      // missing ref: try the next fallback
    }
  }
  return null;
}

function ledgerRows() {
  const rows = new Set();
  for (const line of readFileSync(join(root, "docs", "dependencies.md"), "utf8").split("\n")) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (match) rows.add(match[1].toLowerCase());
  }
  return rows;
}

function registryName(spec, declared) {
  if (typeof spec === "string" && spec.startsWith("npm:")) {
    const rest = spec.slice("npm:".length);
    const at = rest.lastIndexOf("@");
    return at > 0 ? rest.slice(0, at) : rest;
  }
  return declared;
}

async function checkNewDependencies() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const specs = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
  const current = new Set(Object.keys(specs));
  const base = baseRef();
  let old = new Set();
  if (base) {
    try {
      const oldPkg = JSON.parse(
        execFileSync("git", ["show", `${base}:package.json`], { cwd: root, encoding: "utf8" }),
      );
      old = new Set(
        Object.keys({
          ...oldPkg.dependencies,
          ...oldPkg.devDependencies,
          ...oldPkg.optionalDependencies,
        }),
      );
    } catch {
      old = new Set();
    }
  }
  const added = [...current].filter((name) => !old.has(name)).sort();
  if (added.length === 0) {
    console.log("security: new-dependency check: no new dependencies");
    return;
  }
  const ledger = ledgerRows();
  for (const name of added) {
    const manifestPath = join(root, "node_modules", name, "package.json");
    if (!existsSync(manifestPath)) {
      fail(`new dependency ${name} is not installed; run make setup first`);
      continue;
    }
    const version = JSON.parse(readFileSync(manifestPath, "utf8")).version;
    if (!ledger.has(name.toLowerCase())) {
      fail(`new dependency ${name} has no row in docs/dependencies.md`);
    }
    const encoded = encodeURIComponent(registryName(specs[name], name)).replaceAll("%2F", "/");
    let published;
    try {
      const doc = await (
        await fetch(`https://registry.npmjs.org/${encoded}`, {
          signal: AbortSignal.timeout(60_000),
        })
      ).json();
      published = doc.time?.[version];
    } catch (error) {
      fail(`new dependency ${name}: cannot reach the npm registry (${error.message})`);
      continue;
    }
    if (!published) {
      fail(`new dependency ${name}@${version} does not exist on the npm registry`);
      continue;
    }
    const ageDays = (Date.now() - Date.parse(published)) / 86_400_000;
    if (ageDays < MIN_AGE_DAYS) {
      const ready = new Date(Date.parse(published) + MIN_AGE_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10);
      fail(
        `new dependency ${name}@${version} is ${ageDays.toFixed(1)} days old; retry after ${ready}`,
      );
    } else {
      console.log(
        `security: new-dependency check: ${name}@${version} ok (${ageDays.toFixed(0)} days old)`,
      );
    }
  }
}

// --- Scanner binaries -----------------------------------------------------

function assetFor(tool, version) {
  const os = platform();
  const cpu = arch();
  const matrix = os === "win32" ? "windows" : os === "darwin" ? "darwin" : "linux";
  const bits = cpu === "arm64" ? "arm64" : "x64";
  if (tool === "gitleaks") {
    const ext = os === "win32" ? "zip" : "tar.gz";
    return {
      repo: "gitleaks/gitleaks",
      asset: `gitleaks_${version}_${matrix}_${bits}.${ext}`,
      checksums: `gitleaks_${version}_checksums.txt`,
      binary: os === "win32" ? "gitleaks.exe" : "gitleaks",
      versionArgs: ["version"],
    };
  }
  const goarch = bits === "arm64" ? "arm64" : "amd64";
  const goos = matrix === "windows" ? "windows" : matrix;
  return {
    repo: "google/osv-scanner",
    asset: `osv-scanner_${goos}_${goarch}${os === "win32" ? ".exe" : ""}`,
    checksums: "osv-scanner_SHA256SUMS",
    binary: `osv-scanner${os === "win32" ? ".exe" : ""}`,
    versionArgs: ["--version"],
  };
}

function fromPath(binary, versionArgs, version) {
  try {
    const out = execFileSync(binary, versionArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (out.includes(version)) return binary;
  } catch {
    // not on PATH at the pinned version: download it
  }
  return null;
}

async function ensureTool(tool, version) {
  const spec = assetFor(tool, version);
  const hit = fromPath(spec.binary, spec.versionArgs, version);
  if (hit) return hit;
  const dir = join(toolsDir, `${tool}-${version}`);
  const dest = join(dir, spec.binary);
  if (existsSync(dest)) return dest;
  console.log(`security: downloading ${tool} ${version}`);
  const base = `https://github.com/${spec.repo}/releases/download/v${version}`;
  const archive = await fetchBytes(`${base}/${spec.asset}`);
  const sums = (await fetchBytes(`${base}/${spec.checksums}`)).toString("utf8");
  const line = sums.split(/\r?\n/).find((entry) => entry.trim().split(/\s+/).at(-1) === spec.asset);
  const expected = line?.trim().split(/\s+/)[0];
  const actual = createHash("sha256").update(archive).digest("hex");
  if (!expected || actual !== expected.toLowerCase()) {
    fail(`${tool} ${version}: checksum mismatch for ${spec.asset}`);
    throw new Error("checksum mismatch");
  }
  mkdirSync(dir, { recursive: true });
  if (spec.asset.endsWith(".tar.gz") || spec.asset.endsWith(".zip")) {
    const file = join(dir, spec.asset);
    writeFileSync(file, archive);
    if (spec.asset.endsWith(".zip") && platform() === "win32") {
      // Windows bsdtar cannot read these zips; Expand-Archive can.
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Expand-Archive -Path '${spec.asset}' -DestinationPath '.' -Force`,
        ],
        { cwd: dir, stdio: "inherit" },
      );
    } else {
      execFileSync("tar", ["-xf", spec.asset], { cwd: dir, stdio: "inherit" });
    }
  } else {
    writeFileSync(dest, archive);
    if (platform() !== "win32") chmodSync(dest, 0o755);
  }
  if (!existsSync(dest)) {
    fail(`${tool} ${version}: ${spec.binary} missing from ${spec.asset}`);
    throw new Error("binary missing");
  }
  return dest;
}

function run(binary, args, label) {
  const result = spawnSync(binary, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? "signal"}`);
  } else {
    console.log(`security: ${label} passed`);
  }
}

// --- Main -----------------------------------------------------------------

async function main() {
  const gitleaksVersion = process.env.GITLEAKS_VERSION;
  const osvVersion = process.env.OSV_SCANNER_VERSION;
  if (!gitleaksVersion || !osvVersion) {
    fail("tool versions are unset; run via make security");
    return;
  }
  await checkNewDependencies();
  if (process.exitCode) return;

  try {
    const gitleaks = await ensureTool("gitleaks", gitleaksVersion);
    run(gitleaks, ["git", "--redact", "--no-banner", "--exit-code", "1"], "gitleaks secret scan");
  } catch (error) {
    if (!process.exitCode) fail(`gitleaks failed: ${error.message}`);
  }
  try {
    const scanner = await ensureTool("osv-scanner", osvVersion);
    run(scanner, ["--recursive", "--format", "table", "."], "osv-scanner dependency scan");
  } catch (error) {
    if (!process.exitCode) fail(`osv-scanner failed: ${error.message}`);
  }
}

await main();
