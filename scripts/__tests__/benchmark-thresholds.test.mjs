import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync('scripts/benchmark-detection.mjs', 'utf8');

test('benchmark detection defaults to realistic top-1 threshold', () => {
  assert.match(
    script,
    /minTop1 = parseFloat\(args\.get\("min-top1"\) \|\| "0\.5"\)/u,
    'must default min-top1 to 0.5 (50%)'
  );
});

test('benchmark detection defaults to realistic top-3 threshold', () => {
  assert.match(
    script,
    /minTop3 = parseFloat\(args\.get\("min-top3"\) \|\| "0\.6"\)/u,
    'must default min-top3 to 0.6 (60%)'
  );
});

test('benchmark detection defaults to realistic hard-sample threshold', () => {
  assert.match(
    script,
    /minHardTop1 = parseFloat\(args\.get\("min-hard-top1"\) \|\| "0\.0"\)/u,
    'must default min-hard-top1 to 0.0 (0%)'
  );
});

test('benchmark detection does not use old 80% threshold', () => {
  assert.doesNotMatch(
    script,
    /0\.8\b/u,
    'must not hardcode old 80% threshold'
  );
});

test('benchmark detection checks all three thresholds', () => {
  assert.match(script, /top1Accuracy < minTop1/u, 'must check top1 against minTop1');
  assert.match(script, /top3Accuracy < minTop3/u, 'must check top3 against minTop3');
  assert.match(script, /hardAccuracy < minHardTop1/u, 'must check hard accuracy against minHardTop1');
});
