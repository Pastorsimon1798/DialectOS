import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const bulkTypes = readFileSync('packages/providers/src/bulk/types.ts', 'utf8');
const bulkEngine = readFileSync('packages/providers/src/bulk/engine.ts', 'utf8');
const websiteCommand = readFileSync('packages/cli/src/commands/translate-website.ts', 'utf8');
const cliIndex = readFileSync('packages/cli/src/index.ts', 'utf8');

test('BulkTranslationResult has warnings field', () => {
  assert.match(bulkTypes, /warnings:\s*string\[\]/u, 'BulkTranslationResult must expose warnings');
});

test('bulk engine saveCheckpoint returns boolean instead of swallowing', () => {
  assert.match(bulkEngine, /saveCheckpoint[\s\S]*?Promise<boolean>/u, 'saveCheckpoint must return Promise<boolean>');
  // Ensure saveCheckpoint contains return false in catch (not old silent swallow)
  const idx = bulkEngine.indexOf('private async saveCheckpoint');
  assert.ok(idx >= 0, 'must find saveCheckpoint method');
  const snippet = bulkEngine.slice(idx, idx + 600);
  assert.match(snippet, /return false/u, 'saveCheckpoint catch must return false');
  assert.doesNotMatch(snippet, /catch\s*\{\s*\/\/ Non-fatal\s*\}/u, 'saveCheckpoint must not silently swallow errors');
});

test('translate-website respects allowPartial option', () => {
  assert.match(websiteCommand, /allowPartial\s*=\s*false/u, 'translate-website must default allowPartial to false');
});

test('translate-website skips writes when failures exist and allowPartial is false', () => {
  assert.match(
    websiteCommand,
    /if\s*\(\s*result\.failures\.length\s*>\s*0\s*&&\s*!allowPartial\s*\)/u,
    'translate-website must skip writes on failure unless allowPartial is true'
  );
});

test('CLI translate-website command exposes --allow-partial flag', () => {
  assert.match(cliIndex, /--allow-partial/u, 'CLI must expose --allow-partial flag');
});
