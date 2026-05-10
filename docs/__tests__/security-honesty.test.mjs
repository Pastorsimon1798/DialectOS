import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const securityReadme = readFileSync('packages/security/README.md', 'utf8');
const agents = readFileSync('AGENTS.md', 'utf8');
const fetchUtils = readFileSync('packages/providers/src/fetch-utils.ts', 'utf8');

test('security README Features section does not claim SSRF protection', () => {
  const featuresMatch = securityReadme.match(/## Features[\s\S]+?(?=## |\Z)/);
  assert.ok(featuresMatch, 'security README must have a Features section');
  assert.doesNotMatch(
    featuresMatch[0],
    /SSRF/i,
    'Features section must not claim SSRF protection'
  );
});

test('security README Features section does not claim ANSI sanitization', () => {
  const featuresMatch = securityReadme.match(/## Features[\s\S]+?(?=## |\Z)/);
  assert.ok(featuresMatch, 'security README must have a Features section');
  assert.doesNotMatch(
    featuresMatch[0],
    /ANSI/i,
    'Features section must not claim ANSI sanitization'
  );
});

test('security README documents what lives elsewhere', () => {
  assert.match(
    securityReadme,
    /What lives elsewhere/i,
    'security README must document where SSRF and ANSI live'
  );
});

test('AGENTS.md does not list validateInput as a security export', () => {
  assert.doesNotMatch(
    agents,
    /validateInput/,
    'AGENTS.md must not list non-existent validateInput export'
  );
});

test('fetchWithRedirects strips sensitive headers on cross-origin redirect', () => {
  assert.match(
    fetchUtils,
    /stripSensitiveHeaders/,
    'fetchWithRedirects must strip sensitive headers on cross-origin redirect'
  );
  assert.match(
    fetchUtils,
    /isSameOrigin/,
    'fetchWithRedirects must compare origin before forwarding headers'
  );
  assert.match(
    fetchUtils,
    /authorization/i,
    'fetchWithRedirects must mention authorization header stripping'
  );
});
