import { TranslationCorpus } from "@dialectos/providers";
import { validateFilePath } from "@dialectos/security";
import type { SpanishDialect } from "@dialectos/types";
import { writeOutput, writeError } from "../lib/output.js";

export async function executeCorpusStats(): Promise<void> {
  const corpus = new TranslationCorpus();
  const stats = await corpus.getStats();

  writeOutput(`Corpus statistics:`);
  writeOutput(`  Entries: ${stats.totalEntries}`);
  writeOutput(`  Corrections: ${stats.totalCorrections}`);
  writeOutput(`  Quality distribution:`);
  writeOutput(`    High (≥80): ${stats.qualityDistribution.high}`);
  writeOutput(`    Medium (50-79): ${stats.qualityDistribution.medium}`);
  writeOutput(`    Low (<50): ${stats.qualityDistribution.low}`);

  if (Object.keys(stats.byDialect).length > 0) {
    writeOutput(`  By dialect:`);
    for (const [dialect, count] of Object.entries(stats.byDialect)) {
      writeOutput(`    ${dialect}: ${count}`);
    }
  } else {
    writeOutput(`  No dialect entries recorded.`);
  }
}

export async function executeCorpusExport(options: {
  dialect?: string;
  output: string;
}): Promise<void> {
  const corpus = new TranslationCorpus();
  const outputPath = validateFilePath(options.output);
  const dialect = options.dialect as SpanishDialect | undefined;

  await corpus.exportCorpus(outputPath, dialect);

  const label = dialect ? `dialect ${dialect}` : "all dialects";
  writeOutput(`Exported ${label} corpus to ${outputPath}`);
}
