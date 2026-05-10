import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

function getPackageExports(pkg) {
  const indexPath = `packages/${pkg}/src/index.ts`;
  try {
    const src = readFileSync(indexPath, 'utf8');
    const exports = [];
    const namedMatches = src.matchAll(/export\s*\{([^}]+)\}/gu);
    for (const m of namedMatches) {
      for (const name of m[1].split(',')) {
        const trimmed = name.trim().split(/\s+as\s+/).pop().trim();
        if (trimmed) exports.push(trimmed);
      }
    }
    const declMatches = src.matchAll(/export\s*(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/gu);
    for (const m of declMatches) exports.push(m[1]);
    const starMatches = src.matchAll(/export\s*\*\s*from\s*["']([^"']+)["']/gu);
    for (const m of starMatches) {
      const relPath = m[1].replace(/\.js$/, '.ts');
      const subPath = `packages/${pkg}/src/${relPath}`;
      try {
        const subSrc = readFileSync(subPath, 'utf8');
        const subNamed = subSrc.matchAll(/export\s*(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/gu);
        for (const sm of subNamed) exports.push(sm[1]);
      } catch { /* ignore */ }
    }
    return exports;
  } catch {
    return [];
  }
}

// Known false claims per package
const KNOWN_FALSE_CLAIMS = {
  'locale-utils': ['detectMissingKeys', 'mergeLocales', 'parseLocale', 'normalizeLocale'],
  'markdown-parser': ['restoreMarkdown'],
  'cli': ['eval-harness.ts'],
  'mcp': ['createMcpServer'],
};

for (const [pkg, falseClaims] of Object.entries(KNOWN_FALSE_CLAIMS)) {
  const readme = readFileSync(`packages/${pkg}/README.md`, 'utf8');
  test(`${pkg} README does not claim known false exports`, () => {
    for (const claim of falseClaims) {
      assert.doesNotMatch(
        readme,
        new RegExp(`\\b${claim}\\b`, 'u'),
        `packages/${pkg}/README.md must not claim false export \`${claim}\``
      );
    }
  });
}

test('AGENTS.md locale-utils exports match actual exports', () => {
  const exports = getPackageExports('locale-utils');
  assert.ok(exports.includes('readLocaleFile'));
  assert.ok(exports.includes('writeLocaleFile'));
  assert.ok(exports.includes('flattenLocale'));
  assert.ok(exports.includes('unflattenLocale'));
  assert.ok(exports.includes('diffLocales'));
});

test('AGENTS.md markdown-parser exports match actual exports', () => {
  const exports = getPackageExports('markdown-parser');
  assert.ok(exports.includes('reconstructMarkdown'));
});

test('AGENTS.md mcp exports match actual exports', () => {
  const exports = getPackageExports('mcp');
  assert.ok(exports.includes('createServer'));
});

test('examples/basic-translation does not use stale batch-translate flags', () => {
  const example = readFileSync('examples/basic-translation/README.md', 'utf8');
  assert.doesNotMatch(example, /--output-dir/u);
  assert.doesNotMatch(example, /npm install @dialectos\/cli/u);
});
