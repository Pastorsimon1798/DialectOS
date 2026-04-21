/**
 * Build script: extracts pure functions from actual TypeScript source
 * and generates a browser-compatible JS module for the demo.
 */
const fs = require('fs');
const path = require('path');

function getLines(file, start, end) {
  return fs.readFileSync(file, 'utf8').split('\n').slice(start - 1, end).join('\n');
}

const d = path.join(__dirname, '../packages/cli/src/lib/dialect-info.ts');
const m = path.join(__dirname, '../packages/cli/src/commands/i18n/manage-variants.ts');

// Exact line ranges from source
const blocks = [
  getLines(d, 30, 481),    // DIALECT_METADATA
  getLines(d, 506, 520),   // getWordBoundaries
  getLines(d, 527, 586),   // detectDialect
  getLines(m, 32, 35),     // VOSOTROS_ADAPTATION
  getLines(m, 38, 302),    // TECH_ADAPTATIONS
  getLines(m, 308, 337),   // DIALECT_ADAPTATIONS
  getLines(m, 354, 365),   // applyAdaptations
];

function stripTS(code) {
  return code
    .replace(/:\s*Record<\s*SpanishDialect\s*,\s*Array<\{[\s\S]*?\}>\s*>/g, '')
    .replace(/:\s*Record<\n\s*SpanishDialect,\n\s*Array<\{[\s\S]*?\}>\n\s*>/g, '')
    .replace(/:\s*DialectMetadata\[\]/g, '')
    .replace(/:\s*DialectMetadata\s*\|\s*undefined/g, '')
    .replace(/:\s*SpanishDialect/g, '')
    .replace(/:\s*string\[\]/g, '')
    .replace(/:\s*string/g, '')
    .replace(/:\s*number/g, '')
    .replace(/:\s*Set<string>/g, '')
    .replace(/:\s*RegisterPreference/g, '')
    .replace(/:\s*DetectionResult/g, '')
    .replace(/:\s*"formal"\s*\|\s*"slang"\s*\|\s*"neutral"/g, '')
    .replace(/:\s*"any"\s*\|\s*"formal"\s*\|\s*"slang"/g, '')
    .replace(/:\s*Array<\{[\s\S]*?\}>/g, '')
    .replace(/:\s*VariantResult/g, '')
    .replace(/:\s*I18nEntry\[\]/g, '')
    .replace(/:\s*I18nEntry/g, '')
    .replace(/:\s*ManageVariantsOptions/g, '')
    .replace(/:\s*Promise<VariantResult>/g, '')
    .replace(/readonly /g, '')
    .replace(/export /g, '')
    .replace(/new Set<string>\(\)/g, 'new Set()')
    .replace(/^import .* from .*;\n?/gm, '')
    .replace(/^import type .* from .*;\n?/gm, '');
}

const output = `// AUTO-GENERATED from packages/cli/src/lib/dialect-info.ts
// and packages/cli/src/commands/i18n/manage-variants.ts
// Do not edit manually. Run: node scripts/build-demo.cjs

${blocks.map(stripTS).join('\n\n')}

// Browser exports
if (typeof window !== 'undefined') {
  window.DIALECT_METADATA = DIALECT_METADATA;
  window.detectDialect = detectDialect;
  window.applyAdaptations = applyAdaptations;
  window.DIALECT_ADAPTATIONS = DIALECT_ADAPTATIONS;
}
`;

fs.writeFileSync(path.join(__dirname, '../docs/dialectos-engine.js'), output);
console.log('Generated docs/dialectos-engine.js (' + output.length + ' chars)');

try {
  require('child_process').execSync('node --check docs/dialectos-engine.js', { cwd: path.join(__dirname, '..') });
  console.log('Syntax OK');
} catch (e) {
  console.error('Syntax check failed:', e.stdout?.toString() || e.message);
  process.exit(1);
}
