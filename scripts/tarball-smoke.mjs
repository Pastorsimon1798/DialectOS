#!/usr/bin/env node
/**
 * Smoke-test a packed workspace tarball.
 * Usage: node scripts/tarball-smoke.mjs <path-to-tarball>
 *
 * Verifies:
 * - tarball extracts cleanly
 * - package.json has no workspace:* deps
 * - main entry file exists
 * - bin entry file exists and has shebang (if bin is declared)
 */

import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const tarball = process.argv[2];
if (!tarball) {
  console.error("Usage: node scripts/tarball-smoke.mjs <path-to-tarball>");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "dialectos-tarball-smoke-"));

// Extract tarball
execSync(`tar -xzf "${tarball}" -C "${tmp}"`, { stdio: "ignore" });

const pkgDir = join(tmp, "package");
const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));

// Check no workspace:* in dependencies
const allDeps = {
  ...pkg.dependencies,
  ...pkg.optionalDependencies,
  ...pkg.peerDependencies,
};
for (const [name, version] of Object.entries(allDeps)) {
  if (version === "workspace:*") {
    throw new Error(`Unresolved workspace dependency: ${name}@${version}`);
  }
}

// Check main entry exists
if (pkg.main) {
  const mainPath = join(pkgDir, pkg.main);
  if (!existsSync(mainPath)) {
    throw new Error(`Missing main entry: ${pkg.main}`);
  }
}

// Check types entry exists
if (pkg.types) {
  const typesPath = join(pkgDir, pkg.types);
  if (!existsSync(typesPath)) {
    throw new Error(`Missing types entry: ${pkg.types}`);
  }
}

// Check bin entries exist and have shebang
if (pkg.bin) {
  const bins = typeof pkg.bin === "string" ? { [pkg.name]: pkg.bin } : pkg.bin;
  for (const [name, path] of Object.entries(bins)) {
    const binPath = join(pkgDir, path);
    if (!existsSync(binPath)) {
      throw new Error(`Missing bin entry: ${name} -> ${path}`);
    }
    const firstLine = readFileSync(binPath, "utf8").split("\n")[0];
    if (!firstLine.startsWith("#!/")) {
      throw new Error(`Bin entry missing shebang: ${name} -> ${path}`);
    }
  }
}

console.log(`Tarball smoke passed for ${pkg.name}@${pkg.version}`);
