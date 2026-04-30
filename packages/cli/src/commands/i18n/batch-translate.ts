/**
 * Batch-translate command handler
 * Translates base locale to multiple target dialects with full resilience
 */

import { readLocaleFile, writeLocaleFile } from "@dialectos/locale-utils";
import { validateFilePath, MAX_ARRAY_LENGTH } from "@dialectos/security";
import type { TranslationProvider, SpanishDialect, ProviderName, I18nEntry } from "@dialectos/types";
import { ALL_SPANISH_DIALECTS } from "@dialectos/types";
import { BulkTranslationEngine } from "@dialectos/providers";
import type { BulkTranslationItem, BulkTranslationProgress } from "@dialectos/providers";
import { writeError, writeInfo, writeOutput } from "../../lib/output.js";
import { join } from "node:path";

function validateDialects(dialects: SpanishDialect[]): void {
  for (const dialect of dialects) {
    if (!ALL_SPANISH_DIALECTS.includes(dialect)) {
      throw new Error(`Invalid dialect code: ${dialect}`);
    }
  }
}

function formatProgress(p: BulkTranslationProgress): string {
  const pct = Math.round((p.completed / p.total) * 100);
  const eta = p.estimatedRemainingMs
    ? `ETA ${Math.ceil(p.estimatedRemainingMs / 1000)}s`
    : "";
  return `[${pct}%] ${p.completed}/${p.total} done, ${p.succeeded} OK, ${p.failed} fail, ${p.cacheHits} cache hits ${eta}`;
}

export interface BatchTranslateOptions {
  /** Enable translation memory caching (default: true) */
  useCache?: boolean;
  /** Max concurrent API calls (default: 4) */
  concurrency?: number;
  /** Checkpoint file for resumable jobs */
  checkpointFile?: string;
  /** Output failures to a dead-letter file */
  deadLetterFile?: string;
  /** Merge with existing target files instead of overwriting (default: true) */
  merge?: boolean;
}

/**
 * Execute the batch-translate command with BulkTranslationEngine
 */
export async function executeBatchTranslate(
  directory: string,
  baseLocale: string,
  targets: SpanishDialect[],
  providerName: ProviderName | "auto" | undefined,
  getProvider: (name?: ProviderName | "auto") => TranslationProvider,
  options: BatchTranslateOptions = {}
): Promise<void> {
  const {
    useCache = true,
    concurrency = 4,
    checkpointFile,
    deadLetterFile,
    merge = true,
  } = options;

  try {
    const provider = getProvider(providerName);

    if (targets.length === 0) {
      writeError("At least one target dialect is required");
      process.exit(1);
    }

    if (targets.length > MAX_ARRAY_LENGTH) {
      writeError(`Cannot exceed ${MAX_ARRAY_LENGTH} target dialects`);
      process.exit(1);
    }

    validateDialects(targets);

    const validatedDir = validateFilePath(directory);
    const basePath = join(validatedDir, `${baseLocale}.json`);
    const baseEntries = readLocaleFile(basePath);

    if (baseEntries.length === 0) {
      writeInfo("No keys to translate");
      return;
    }

    let totalSuccess = 0;
    let totalFail = 0;
    let totalCacheHits = 0;
    let totalApiCalls = 0;

    for (const targetDialect of targets) {
      writeInfo(`Translating to ${targetDialect}...`);

      const targetPath = join(validatedDir, `${targetDialect}.json`);

      // Load existing target entries for merging
      let existingEntries: I18nEntry[] = [];
      if (merge) {
        try {
          existingEntries = readLocaleFile(targetPath);
        } catch {
          // File doesn't exist yet
        }
      }
      const existingMap = new Map(existingEntries.map((e) => [e.key, e.value]));

      // Build items for bulk engine
      const items: BulkTranslationItem[] = baseEntries.map((entry) => ({
        id: `${targetDialect}:${entry.key}`,
        sourceText: entry.value,
        sourceLang: baseLocale,
        targetLang: "es",
        options: { dialect: targetDialect },
      }));

      // Per-dialect checkpoint
      const dialectCheckpoint = checkpointFile
        ? `${checkpointFile}.${targetDialect}.json`
        : undefined;

      const engine = new BulkTranslationEngine({
        maxConcurrency: concurrency,
        useCache,
        checkpointPath: dialectCheckpoint,
        onProgress: (p) => {
          writeOutput(formatProgress(p));
        },
      });

      const result = await engine.translate(items, provider);

      // Build final entries: merge translated + existing
      const translatedMap = new Map(
        result.successes.map((s) => {
          const key = s.item.id.split(":")[1];
          return [key, s.result.translatedText];
        })
      );

      const finalEntries: I18nEntry[] = [];
      for (const baseEntry of baseEntries) {
        const translated = translatedMap.get(baseEntry.key);
        if (translated !== undefined) {
          finalEntries.push({ key: baseEntry.key, value: translated });
        } else if (merge && existingMap.has(baseEntry.key)) {
          finalEntries.push({ key: baseEntry.key, value: existingMap.get(baseEntry.key)! });
        }
        // If not translated and not merging, the key is omitted
      }

      writeLocaleFile(targetPath, finalEntries, 2);

      totalSuccess += result.successes.length;
      totalFail += result.failures.length;
      totalCacheHits += result.cacheHits;
      totalApiCalls += result.apiCalls;

      // Report failures
      if (result.failures.length > 0) {
        writeError(`${result.failures.length} failures for ${targetDialect}:`);
        for (const f of result.failures) {
          const key = f.item.id.split(":")[1];
          writeError(`  - ${key}: ${f.error}`);
        }

        if (deadLetterFile) {
          const dlqPath = `${deadLetterFile}.${targetDialect}.jsonl`;
          const fs = await import("node:fs");
          const lines = result.failures.map((f) =>
            JSON.stringify({
              dialect: targetDialect,
              key: f.item.id.split(":")[1],
              sourceText: f.item.sourceText,
              error: f.error,
              retryCount: f.retryCount,
              failedAt: f.failedAt,
            })
          );
          fs.appendFileSync(dlqPath, lines.join("\n") + "\n", "utf-8");
          writeInfo(`Dead-letter queue written to ${dlqPath}`);
        }
      }
    }

    writeInfo("Batch translation completed");
    writeInfo(`Directory: ${validatedDir}`);
    writeInfo(`Base locale: ${baseLocale}`);
    writeInfo(`Targets: ${targets.join(", ")}`);
    writeInfo(`Total keys: ${totalSuccess + totalFail}`);
    writeInfo(`Success: ${totalSuccess}`);
    writeInfo(`Failures: ${totalFail}`);
    writeInfo(`Cache hits: ${totalCacheHits}`);
    writeInfo(`API calls: ${totalApiCalls}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeError(message);
    throw error;
  }
}
