import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync('scripts/benchmark-detection.mjs', 'utf8');

test('benchmark detection defaults to launch-grade top-1 threshold', () => {
  assert.match(
    script,
    /minTop1 = parseFloat\(args\.get\("min-top1"\) \|\| "0\.8"\)/u,
    'must default min-top1 to 0.8 (80%)'
  );
});

test('benchmark detection defaults to launch-grade top-3 threshold', () => {
  assert.match(
    script,
    /minTop3 = parseFloat\(args\.get\("min-top3"\) \|\| "0\.9"\)/u,
    'must default min-top3 to 0.9 (90%)'
  );
});

test('benchmark detection defaults to launch-grade hard-sample threshold', () => {
  assert.match(
    script,
    /minHardTop1 = parseFloat\(args\.get\("min-hard-top1"\) \|\| "0\.6"\)/u,
    'must default min-hard-top1 to 0.6 (60%)'
  );
});

test('benchmark detection does not use old 50% threshold', () => {
  assert.doesNotMatch(
    script,
    /0\.5\b/u,
    'must not hardcode old 50% threshold'
  );
});

test('benchmark detection checks all three thresholds', () => {
  assert.match(script, /top1Accuracy < minTop1/u, 'must check top1 against minTop1');
  assert.match(script, /top3Accuracy < minTop3/u, 'must check top3 against minTop3');
  assert.match(script, /hardAccuracy < minHardTop1/u, 'must check hard accuracy against minHardTop1');
});
