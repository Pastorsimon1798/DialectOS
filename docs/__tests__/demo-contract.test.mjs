import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('live translation path resets button in finally block', () => {
  const html = readFileSync('docs/index.html', 'utf8');
  assert.match(html, /finally\s*\{/u, 'must have a finally block for button cleanup');
  assert.match(html, /translateButton'\)\.disabled\s*=\s*false/u, 'must re-enable button');
});

test('demo does not hardcode judge passed', () => {
  const html = readFileSync('docs/index.html', 'utf8');
  assert.doesNotMatch(html, /\['quality',\s*'judge passed'\]/u, 'must not hardcode quality verdict');
});

test('demo receipts use real response fields', () => {
  const html = readFileSync('docs/index.html', 'utf8');
  assert.doesNotMatch(html, /judge passed/u, 'must not contain hardcoded judge passed text');
});
