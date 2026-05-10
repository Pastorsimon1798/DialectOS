import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const workflow = readFileSync('.github/workflows/release.yml', 'utf8');

test('release workflow is workflow_dispatch only', () => {
  assert.match(workflow, /workflow_dispatch/);
  assert.doesNotMatch(workflow, /push:\s*\n\s*tags:/);
  assert.doesNotMatch(workflow, /npm publish(?!\s+--dry-run)/);
});

test('release workflow includes verification steps', () => {
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /pnpm test:coverage/);
  assert.match(workflow, /pnpm audit/);
});

test('release workflow includes package smoke', () => {
  assert.match(workflow, /tarball-smoke/);
});

test('release workflow includes dry-run publish', () => {
  assert.match(workflow, /npm publish --dry-run/);
});
