import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('docs deployment contains discovery files', () => {
  for (const path of ['docs/index.html', 'docs/robots.txt', 'docs/sitemap.xml', 'docs/llms.txt']) {
    assert.equal(existsSync(path), true, `${path} must exist because Pages uploads docs/`);
  }
});

test('docs links use paths valid under docs/ deployment root', () => {
  const html = readFileSync('docs/index.html', 'utf8');
  assert.doesNotMatch(html, /href="docs\/full-app-demo\.md"/u, 'link uses docs/ prefix which is invalid under Pages root');
  assert.match(html, /href="full-app-demo\.md"/u, 'link must use root-relative path');
});
