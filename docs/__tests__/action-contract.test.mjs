import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const action = readFileSync('action.yml', 'utf8');

test('action.yml does not escape action_path with /..', () => {
  assert.doesNotMatch(action, /action_path\s*\}\s*\/\.\./u, 'action.yml must not use github.action_path}}/..');
});

test('action.yml build step uses github.action_path as working-directory', () => {
  assert.ok(action.includes('working-directory: ${{ github.action_path }}'), 'build step must use github.action_path');
});

test('action.yml validate step references ci-validate.mjs via action_path', () => {
  assert.ok(
    action.includes('"${{ github.action_path }}/scripts/ci-validate.mjs"'),
    'validate step must reference ci-validate.mjs via action_path'
  );
});

test('action.yml passes --cli-path pointing to action_path', () => {
  assert.ok(
    action.includes('--cli-path="${{ github.action_path }}/packages/cli/dist/index.js"'),
    'validate step must pass --cli-path via action_path'
  );
});

test('action.yml references only existing scripts', () => {
  const scriptRefs = [...action.matchAll(/scripts\/([\w\-]+\.mjs)/gu)].map((m) => m[1]);
  assert.ok(scriptRefs.length > 0, 'expected at least one script reference');
  for (const script of scriptRefs) {
    assert.ok(existsSync(`scripts/${script}`), `action.yml references missing script: scripts/${script}`);
  }
});
