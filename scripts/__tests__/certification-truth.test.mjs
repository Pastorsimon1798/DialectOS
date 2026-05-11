import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const adversarial = readFileSync('scripts/dialect-certify-adversarial.mjs', 'utf8');
const documents = readFileSync('scripts/dialect-certify-documents.mjs', 'utf8');

test('adversarial runner forwards fail-on-warnings flag', () => {
  assert.match(
    adversarial,
    /"fail-on-warnings"/u,
    'passThroughArgs must forward fail-on-warnings'
  );
});

test('adversarial runner forwards judge flag', () => {
  assert.match(
    adversarial,
    /"judge"/u,
    'passThroughArgs must forward judge'
  );
});

test('document cert live mode defaults to strict policy', () => {
  assert.doesNotMatch(
    documents,
    /--policy",\s*"permissive"/u,
    'live commands must not hardcode permissive policy'
  );
  assert.match(
    documents,
    /const policy = args\.get\("policy"\) \|\| "strict"/u,
    'document cert must default to strict policy'
  );
});

test('document cert live mode defaults to strict failure policy', () => {
  assert.doesNotMatch(
    documents,
    /--failure-policy",\s*"allow-partial"/u,
    'live commands must not hardcode allow-partial failure policy'
  );
  assert.match(
    documents,
    /const failurePolicy = args\.get\("failure-policy"\) \|\| "strict"/u,
    'document cert must default to strict failure policy'
  );
});

test('document cert requires explicit allow-mock for mock mode', () => {
  assert.match(
    documents,
    /allowMock\s*=\s*args\.get\("allow-mock"\)/u,
    'document cert must parse allow-mock flag'
  );
  assert.match(
    documents,
    /Document certification requires --live or --allow-mock=true/u,
    'document cert must refuse mock mode without explicit flag'
  );
});
