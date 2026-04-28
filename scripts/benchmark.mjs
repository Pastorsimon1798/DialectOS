#!/usr/bin/env node
/**
 * Benchmark runner for dialect quality evaluation.
 *
 * Usage:
 *   node scripts/benchmark.mjs [--provider=mock-semantic] [--dialects=es-MX,es-AR] [--out=benchmarks/]
 *   node scripts/benchmark.mjs --live --provider=deepl
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const args = new Map();
for (const arg of process.argv.slice(2)) {
  if (arg === "--") continue;
  const [key, value = ""] = arg.replace(/^--/, "").split("=");
  args.set(key, value || "true");
}

const fixtureDir =
  args.get("fixtures") ||
  "packages/cli/src/__tests__/fixtures/dialect-adversarial";
const outDir =
  args.get("out") || `benchmarks/results-${new Date().toISOString().slice(0, 10)}`;
const providerName = args.get("provider") || "mock-semantic";
const live = args.get("live") === "true";
const dialectFilter = new Set(
  (args.get("dialects") || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
);
const categoryFilter = new Set(
  (args.get("categories") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
);

// Import built modules
const { validateTranslation } = await import(
  pathToFileURL(`${process.cwd()}/packages/cli/dist/lib/validate-translation.js`).href
);
const { buildLexicalAmbiguityExpectations } = await import(
  pathToFileURL(`${process.cwd()}/packages/cli/dist/lib/lexical-ambiguity.js`).href
);
const { judgeTranslationOutput } = await import(
  pathToFileURL(`${process.cwd()}/packages/cli/dist/lib/output-judge.js`).href
);

// Dialect-specific mock translation for benchmarking
const VOSEO_DIALECTS = new Set(["es-AR", "es-UY", "es-PY", "es-GT", "es-HN", "es-SV", "es-NI"]);
const VOSOTROS_DIALECTS = new Set(["es-ES", "es-AD"]);
const GUAGUA_BUS_DIALECTS = new Set(["es-CU", "es-DO", "es-PR"]);

function mockTranslate(source, dialect) {
  return source
    .replace(/\bCatch the bus to the office\./i, "Toma el autobús a la oficina.")
    .replace(/\bPick up the file before deployment\./i, "Recoge el archivo antes del despliegue.")
    .replace(/\bPick up the package from reception\./i, "Recoge el paquete de recepción.")
    .replace(/\bDo not use slang in this customer support message\./i, "No use jerga en este mensaje de soporte al cliente.")
    .replace(/\bHi \{userName\}, your %\{count\} files are ready at https:\/\/example\.com\/app\./i,
      `Hola {userName}, tus %{count} archivos están listos en https://example.com/app.`)
    .replace(/\bJugo de china is on the Puerto Rican menu\./i,
      dialect === "es-MX" ? "El jugo de naranja está en el menú puertorriqueño." : "El jugo de china está en el menú puertorriqueño.")
    .replace(/\bPark the car near the office\./i, "Estaciona el coche cerca de la oficina.")
    .replace(/\bThe baby is sleeping\./i, "El bebé está durmiendo.")
    .replace(/\bBuy avocado for lunch\./i, "Compra aguacate para el almuerzo.")
    .replace(/\bUse the computer to open the file\./i, "Usa la computadora para abrir el archivo.")
    .replace(/\bYou can update your account now\./i,
      VOSEO_DIALECTS.has(dialect) ? "Vos podés actualizar tu cuenta ahora." : "Puedes actualizar tu cuenta ahora.");
}

async function createLiveTranslate() {
  const { createProviderRegistry } = await import(
    pathToFileURL(`${process.cwd()}/packages/cli/dist/lib/provider-factory.js`).href
  );
  const { buildSemanticTranslationContext } = await import(
    pathToFileURL(`${process.cwd()}/packages/cli/dist/lib/semantic-context.js`).href
  );
  const registry = createProviderRegistry();
  const available = registry.listProviders();
  if (available.length === 0) {
    throw new Error(
      "No live providers configured. Set LLM_API_URL + LLM_MODEL, DEEPL_AUTH_KEY, etc."
    );
  }

  return async (source, dialect, sample) => {
    const provider =
      providerName === "auto" || providerName === "mock-semantic"
        ? registry.getAuto()
        : registry.get(providerName);
    const context = buildSemanticTranslationContext({
      text: source,
      dialect,
      formality: sample.register,
      documentKind: sample.documentKind,
    });
    const result = await provider.translate(source, "auto", "es", {
      dialect,
      formality: sample.register,
      context,
    });
    return result.translatedText;
  };
}

const translate = live
  ? await createLiveTranslate()
  : async (source, dialect, _sample) => mockTranslate(source, dialect);

function hasTerm(output, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,
    "iu"
  ).test(output);
}

async function evaluateSample(sample, dialect) {
  let output = "";
  const failures = [];
  const warnings = [];

  try {
    output = await translate(sample.source, dialect, sample);
  } catch (error) {
    failures.push(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      id: sample.id,
      dialect,
      category: sample.category,
      severity: sample.severity,
      provider: live ? providerName : "mock-semantic",
      source: sample.source,
      output: "",
      passed: false,
      failures,
      warnings,
      qualityScore: null,
    };
  }

  // Forbidden terms check
  const lexicalExp = buildLexicalAmbiguityExpectations(sample.source, dialect);
  const allForbidden = [
    ...(sample.forbiddenOutputTerms || []),
    ...lexicalExp.forbiddenOutputTerms,
  ];
  for (const term of allForbidden) {
    if (hasTerm(output, term)) {
      failures.push(`Forbidden term: ${term}`);
    }
  }

  // Required output groups
  const allGroups = [
    ...(sample.requiredOutputGroups || []),
    ...lexicalExp.requiredOutputGroups,
  ];
  for (const group of allGroups) {
    if (!group.some((term) => hasTerm(output, term))) {
      failures.push(`Missing required group: ${group.join(", ")}`);
    }
  }

  // Required output any
  if (sample.requiredOutputAny?.length) {
    if (!sample.requiredOutputAny.some((term) => hasTerm(output, term))) {
      failures.push(
        `Missing required output: ${sample.requiredOutputAny.join(", ")}`
      );
    }
  }

  // Output judge
  const judge = judgeTranslationOutput(
    {
      source: sample.source,
      register: sample.register || "auto",
      documentKind: sample.documentKind || "plain",
      forbiddenOutputTerms: allForbidden,
      requiredOutputGroups: allGroups,
    },
    dialect,
    output
  );
  for (const issue of judge.blockingIssues) {
    failures.push(`Judge [${issue.severity}] ${issue.category}: ${issue.message}`);
  }

  // Validate with the unified pipeline
  const report = validateTranslation({
    source: sample.source,
    translated: output,
    dialect,
    isMarkdown: false,
  });

  return {
    id: sample.id,
    dialect,
    category: sample.category,
    severity: sample.severity,
    provider: live ? providerName : "mock-semantic",
    source: sample.source,
    output,
    passed: failures.length === 0 && report.valid,
    failures,
    warnings,
    qualityScore: report.qualityScore.score,
  };
}

// Run benchmark
const results = [];
for (const file of readdirSync(fixtureDir)
  .filter((name) => name.endsWith(".json"))
  .sort()) {
  const dialect = basename(file, ".json");
  if (dialectFilter.size > 0 && !dialectFilter.has(dialect)) continue;

  const samples = JSON.parse(readFileSync(join(fixtureDir, file), "utf-8"));
  for (const sample of samples) {
    if (categoryFilter.size > 0 && !categoryFilter.has(sample.category)) continue;
    results.push(await evaluateSample(sample, dialect));
  }
}

// Aggregate
const byCategory = {};
const byDialect = {};
const bySeverity = {};

for (const r of results) {
  byCategory[r.category] = byCategory[r.category] || { total: 0, passed: 0 };
  byCategory[r.category].total++;
  if (r.passed) byCategory[r.category].passed++;

  byDialect[r.dialect] = byDialect[r.dialect] || { total: 0, passed: 0 };
  byDialect[r.dialect].total++;
  if (r.passed) byDialect[r.dialect].passed++;

  bySeverity[r.severity] = bySeverity[r.severity] || { total: 0, passed: 0 };
  bySeverity[r.severity].total++;
  if (r.passed) bySeverity[r.severity].passed++;
}

const summary = {
  generatedAt: new Date().toISOString(),
  provider: live ? providerName : "mock-semantic",
  live,
  fixtureDir,
  total: results.length,
  passed: results.filter((r) => r.passed).length,
  failed: results.filter((r) => !r.passed).length,
  avgQualityScore:
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) /
            results.length
        )
      : 0,
  byCategory,
  byDialect,
  bySeverity,
  results,
};

mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, "results.json");
writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);

// Markdown report
const mdLines = [
  `# DialectOS Benchmark Report`,
  ``,
  `- **Date**: ${summary.generatedAt}`,
  `- **Provider**: ${summary.provider}`,
  `- **Live**: ${summary.live}`,
  `- **Total**: ${summary.total}`,
  `- **Passed**: ${summary.passed}`,
  `- **Failed**: ${summary.failed}`,
  `- **Pass rate**: ${summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0}%`,
  `- **Avg quality score**: ${summary.avgQualityScore}`,
  ``,
  `## By Category`,
  ``,
  `| Category | Passed | Total | Rate |`,
  `|----------|--------|-------|------|`,
];
for (const [cat, data] of Object.entries(byCategory)) {
  const rate = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : "0.0";
  mdLines.push(`| ${cat} | ${data.passed} | ${data.total} | ${rate}% |`);
}
mdLines.push("", "## By Dialect", "", "| Dialect | Passed | Total | Rate |", "|---------|--------|-------|------|");
for (const [d, data] of Object.entries(byDialect)) {
  const rate = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : "0.0";
  mdLines.push(`| ${d} | ${data.passed} | ${data.total} | ${rate}% |`);
}

if (summary.failed > 0) {
  mdLines.push("", "## Failures", "");
  for (const r of results.filter((r) => !r.passed)) {
    mdLines.push(`### ${r.id} (${r.dialect})`);
    mdLines.push(`- **Source**: ${r.source}`);
    mdLines.push(`- **Output**: ${r.output}`);
    for (const f of r.failures) {
      mdLines.push(`- **FAIL**: ${f}`);
    }
    mdLines.push("");
  }
}

const mdPath = join(outDir, "results.md");
writeFileSync(mdPath, mdLines.join("\n") + "\n");

console.log(
  JSON.stringify(
    {
      outDir,
      jsonPath,
      mdPath,
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      passRate:
        summary.total > 0
          ? `${((summary.passed / summary.total) * 100).toFixed(1)}%`
          : "0%",
      avgQualityScore: summary.avgQualityScore,
    },
    null,
    2
  )
);

if (summary.failed > 0) {
  process.exit(1);
}
