import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync('scripts/launch-gate.mjs', 'utf8');

test('launch gate runs all verification phases', () => {
  assert.match(script, /"pnpm".*"install".*"--frozen-lockfile"/s);
  assert.match(script, /"pnpm".*"build"/s);
  assert.match(script, /"pnpm".*"-r".*"exec".*"tsc".*"--noEmit"/s);
  assert.match(script, /"pnpm".*"test"/s);
  assert.match(script, /"pnpm".*"test:coverage"/s);
  assert.match(script, /"pnpm".*"audit".*"--audit-level=moderate"/s);
  assert.match(script, /scripts\/benchmark\.mjs/s);
  assert.match(script, /scripts\/benchmark-detection\.mjs/s);
  assert.match(script, /scripts\/dialect-certify\.mjs/s);
  assert.match(script, /scripts\/dialect-certify-adversarial\.mjs/s);
  assert.match(script, /scripts\/dialect-certify-documents\.mjs/s);
  assert.match(script, /scripts\/tarball-smoke\.mjs/s);
  assert.match(script, /"docker".*"compose".*"config"/s);
  assert.match(script, /public-claims\.test\.mjs/s);
});

test('launch gate supports --no-docker', () => {
  assert.match(script, /--no-docker/);
  assert.match(script, /Docker checks skipped/);
});

test('launch gate fails fast on blocking failures', () => {
  assert.match(script, /process\.exit\(1\)/);
});

test('launch gate audits with fatal false', () => {
  assert.match(script, /fatal: false/);
});
