/**
 * translate-api-docs and extract-translatable command handlers
 * Translates API documentation markdown files with special handling for tables and lists
 */

import * as fs from "node:fs";
import type { TranslationProvider, SpanishDialect, MarkdownSection, ParsedMarkdown, TranslateOptions } from "@dialectos/types";
import { DEFAULT_DIALECT, ALL_SPANISH_DIALECTS } from "@dialectos/types";
import { parseMarkdown, reconstructMarkdown, extractTranslatableText } from "@dialectos/markdown-parser";
import { validateFilePath, validateContentLength } from "@dialectos/security";
import type { ProviderRegistry } from "@dialectos/providers";
import { TranslationCorpus } from "@dialectos/providers";
import { writeOutput, writeError, writeInfo, sanitizeConsoleOutput } from "../lib/output.js";
import {
  loadProtectedTokens,
  protectTokensInText,
  restoreProtectedTokens,
  detectIdentityTokens,
} from "../lib/token-protection.js";
import {
  loadGlossary,
  prepareGlossaryProtectedText,
  type GlossaryMode,
} from "../lib/glossary-enforcement.js";
import { validateMarkdownStructure } from "../lib/structure-validator.js";
import { validateTranslation } from "../lib/validate-translation.js";
import {
  loadCheckpoint,
  saveCheckpoint,
  hashSource,
  CURRENT_CHECKPOINT_SCHEMA_VERSION,
  type TranslationCheckpoint,
} from "../lib/checkpoint.js";
import {
  translateWithFallback,
  type AdaptivePacingState,
} from "../lib/resilient-translation.js";
import { calculateQualityScore } from "../lib/quality-score.js";
import { buildSemanticTranslationContext } from "../lib/semantic-context.js";
import {
  buildLexicalAmbiguityExpectations,
  checkLexicalCompliance,
} from "../lib/lexical-ambiguity.js";
import { judgeTranslationOutput } from "../lib/output-judge.js";
import {
  formatSemanticQualityError,
  resolvePolicy,
  shouldFailSemanticQuality,
  type PolicyProfile,
} from "../lib/translation-policy.js";

// ============================================================================
// extract-translatable Command
// ============================================================================

/**
 * Execute the extract-translatable command
 * Extracts and outputs only translatable sections from a markdown file
 *
 * @param input - Path to the input markdown file
 * @param getProvider - Provider factory function (unused but kept for consistency)
 */
export async function executeExtractTranslatable(
  input: string,
  getProvider: (name?: string) => TranslationProvider
): Promise<void> {
  try {
    // Validate and resolve file path
    const validatedPath = validateFilePath(input);

    // Read markdown content
    const content = await fs.promises.readFile(validatedPath, "utf-8");
    validateContentLength(content);

    // Parse markdown
    const parsed = parseMarkdown(content);

    // Extract translatable sections and format output
    const outputLines: string[] = [];

    for (const section of parsed.sections) {
      if (section.translatable && section.content) {
        // Format: type: content
        outputLines.push(`${section.type}: ${section.content}`);
      }
    }

    const output = outputLines.join("\n");

    // Write to stdout
    await writeOutput(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeError(message);
    throw error;
  }
}

// ============================================================================
// translate-api-docs Command
// ============================================================================

/**
 * Options for the translate-api-docs command
 */
export interface TranslateApiDocsOptions {
  /** Spanish dialect (default: es-ES) */
  dialect?: SpanishDialect;
  /** Translation provider (default: auto) */
  provider?: string;
  /** Write output to file instead of stdout */
  output?: string;
  /** Optional protected token file path */
  protectTokens?: string;
  /** Optional glossary file path */
  glossaryFile?: string;
  /** Glossary mode */
  glossaryMode?: GlossaryMode;
  /** Auto-protect identity-like tokens */
  protectIdentities?: boolean;
  /** Validate markdown structure */
  validateStructure?: boolean;
  /** Validation mode */
  structureMode?: "warn" | "strict";
  /** Checkpoint file for resumable processing */
  checkpointFile?: string;
  /** Resume from checkpoint */
  resume?: boolean;
  /** Behavior when one or more sections fail translation */
  failurePolicy?: "strict" | "allow-partial";
  /** Operator policy profile */
  policy?: PolicyProfile;
  /** Record translations to corpus */
  corpus?: boolean;
}

/**
 * Validate dialect code
 */
function validateDialect(dialect: string): SpanishDialect {
  if (!ALL_SPANISH_DIALECTS.includes(dialect as SpanishDialect)) {
    throw new Error(
      `Invalid dialect: ${dialect}. Valid dialects are: ${ALL_SPANISH_DIALECTS.join(", ")}`
    );
  }
  return dialect as SpanishDialect;
}

/**
 * Translate a single section
 * For tables and lists, we translate the content as a whole
 */
async function translateSection(
  section: MarkdownSection,
  registry: ProviderRegistry,
  preferredProvider: string | undefined,
  dialect: SpanishDialect,
  protectedTokens: string[],
  glossary: Awaited<ReturnType<typeof loadGlossary>>,
  glossaryMode: GlossaryMode,
  protectIdentities: boolean,
  pacing: AdaptivePacingState
): Promise<{ section: MarkdownSection; failed: boolean }> {
  if (!section.translatable) {
    return { section, failed: false };
  }

  try {
    const glossaryChunk = prepareGlossaryProtectedText(
      section.content,
      glossary,
      glossaryMode
    );
    const runtimeTokens = protectIdentities
      ? detectIdentityTokens(glossaryChunk.text)
      : [];
    const mergedTokens = Array.from(new Set([...protectedTokens, ...runtimeTokens]));
    const protectedChunk = protectTokensInText(glossaryChunk.text, mergedTokens);
    const options: TranslateOptions = {
      dialect,
      context: buildSemanticTranslationContext({
        text: section.content,
        dialect,
        documentKind: "api-docs",
        sectionType: section.type,
      }),
    };
    const result = await translateWithFallback(
      registry,
      preferredProvider,
      protectedChunk.text,
      "auto",
      dialect,
      options,
      pacing
    );

    return {
      section: {
        ...section,
        content: restoreProtectedTokens(
          restoreProtectedTokens(result.translatedText, protectedChunk.replacements),
          glossaryChunk.replacements
        ),
      },
      failed: false,
    };
  } catch (error) {
    // If translation fails, return original section
    console.error(
      `Failed to translate section: ${sanitizeConsoleOutput(error instanceof Error ? error.message : String(error))}`
    );
    return { section, failed: true };
  }
}

/**
 * Translate all translatable sections in parsed markdown
 */
async function translateSections(
  parsed: ParsedMarkdown,
  registry: ProviderRegistry,
  preferredProvider: string | undefined,
  dialect: SpanishDialect,
  protectedTokens: string[],
  glossary: Awaited<ReturnType<typeof loadGlossary>>,
  glossaryMode: GlossaryMode,
  protectIdentities: boolean,
  checkpointPath: string,
  sourcePath: string,
  sourceHash: string,
  resume: boolean
): Promise<{ sections: MarkdownSection[]; failures: number }> {
  const translatedSections: MarkdownSection[] = [];
  const checkpoint = resume ? await loadCheckpoint(checkpointPath) : null;
  const translatedByIndex: Record<number, string> =
    checkpoint && checkpoint.sourcePath === sourcePath && checkpoint.sourceHash === sourceHash
      ? checkpoint.translatedByIndex
      : (() => {
          if (checkpoint && !checkpoint.sourceHash) {
            console.warn("Checkpoint predates source hashing — retranslating all sections");
          }
          return {} as Record<number, string>;
        })();
  const pacing: AdaptivePacingState = { delayMs: 0 };
  let failures = 0;

  for (const [idx, section] of parsed.sections.entries()) {
    if (section.translatable) {
      if (idx in translatedByIndex) {
        translatedSections.push({ ...section, content: translatedByIndex[idx] });
        continue;
      }
      const translated = await translateSection(
        section,
        registry,
        preferredProvider,
        dialect,
        protectedTokens,
        glossary,
        glossaryMode,
        protectIdentities,
        pacing
      );
      translatedSections.push(translated.section);
      if (translated.failed) {
        failures++;
      } else {
        // Only save successfully translated sections to checkpoint
        translatedByIndex[idx] = translated.section.content;
      }
      const state: TranslationCheckpoint = {
        schemaVersion: CURRENT_CHECKPOINT_SCHEMA_VERSION,
        sourcePath,
        sourceHash,
        totalSections: parsed.sections.length,
        translatedByIndex,
      };
      await saveCheckpoint(checkpointPath, state);
    } else {
      // Keep non-translatable sections as-is
      translatedSections.push(section);
    }
  }

  return { sections: translatedSections, failures };
}

/**
 * Execute the translate-api-docs command
 * Translates an API documentation markdown file with special handling for tables and lists
 *
 * @param input - Path to the input markdown file
 * @param dialect - Target Spanish dialect
 * @param options - Command options
 * @param getProvider - Provider factory function
 */
export async function executeTranslateApiDocs(
  input: string,
  dialect: string,
  options: TranslateApiDocsOptions | undefined,
  getRegistry: () => ProviderRegistry
): Promise<void> {
  try {
    // Validate and resolve file path
    const validatedPath = validateFilePath(input);

    // Validate dialect
    const validatedDialect = dialect ? validateDialect(dialect) : DEFAULT_DIALECT;

    // Read markdown content
    const content = await fs.promises.readFile(validatedPath, "utf-8");
    validateContentLength(content);

    // Parse markdown
    const parsed = parseMarkdown(content);

    // Get translation provider
    const providerName = options?.provider;
    const registry = getRegistry();
    const protectedTokens = await loadProtectedTokens(options?.protectTokens);
    const glossary = await loadGlossary(options?.glossaryFile);
    const glossaryMode = (options?.glossaryMode || "off") as GlossaryMode;
    const protectIdentities = options?.protectIdentities !== false;
    const outputPath = options?.output;
    const outputIsFile = outputPath ? /\.[a-zA-Z0-9]+$/.test(outputPath) : false;
    const rawCheckpointPath =
      options?.checkpointFile || `${outputIsFile && outputPath ? outputPath : validatedPath}.checkpoint.json`;
    // Always validate checkpoint paths to prevent traversal via --output
    const checkpointPath = validateFilePath(rawCheckpointPath);
    const resume = options?.resume !== false;
    const sourceHash = hashSource(content);

    // Translate all translatable sections
    const sectionResult = await translateSections(
      parsed,
      registry,
      providerName,
      validatedDialect,
      protectedTokens,
      glossary,
      glossaryMode,
      protectIdentities,
      checkpointPath,
      validatedPath,
      sourceHash,
      resume
    );
    const failurePolicy = options?.failurePolicy ?? "strict";
    if (sectionResult.failures > 0 && failurePolicy === "strict") {
      throw new Error(
        `Section translation failed for ${sectionResult.failures} translatable block(s)`
      );
    }
    if (sectionResult.failures > 0 && failurePolicy === "allow-partial") {
      console.warn(
        `Partial translation output: ${sectionResult.failures} translatable block(s) failed`
      );
    }

    // Reconstruct markdown with translated content
    const translated = reconstructMarkdown(parsed.sections, sectionResult.sections);

    // Run unified validation pipeline
    const report = validateTranslation({
      source: content,
      translated,
      dialect: validatedDialect,
      protectedTokens,
      glossary: glossary?.mappings || {},
      isMarkdown: true,
    });

    const policy = resolvePolicy(options?.policy || "balanced", {
      failurePolicy: options?.failurePolicy,
      validateStructure: options?.validateStructure,
      structureMode: options?.structureMode,
      glossaryMode,
      protectIdentities,
      resume,
    });

    // Enforce structure validation policy
    if (options?.validateStructure !== false && report.structureValidation && !report.structureValidation.valid) {
      const msg = `Structure validation failed: ${report.structureValidation.violations.join("; ")}`;
      if ((options?.structureMode || "strict") === "strict") {
        throw new Error(msg);
      }
      console.warn(msg);
    }

    // Enforce semantic quality gate
    const semanticGateApplies = content.trim().length >= 120 || translated.trim().length >= 120;
    if (semanticGateApplies && shouldFailSemanticQuality(policy, report.qualityScore.semanticSimilarity)) {
      throw new Error(formatSemanticQualityError(policy, report.qualityScore.semanticSimilarity));
    }

    // Enforce output judge policy
    if (report.outputJudge.blockingIssues.length > 0) {
      const judgeMsg = `Output judge failed: ${report.outputJudge.blockingIssues.map((i) => i.message).join("; ")}`;
      if (policy.failurePolicy === "strict") {
        throw new Error(judgeMsg);
      }
      console.warn(judgeMsg);
    }

    console.error(
      `[quality] score=${report.qualityScore.score} token=${(report.qualityScore.tokenIntegrity * 100).toFixed(
        0
      )}% glossary=${(report.qualityScore.glossaryFidelity * 100).toFixed(0)}% structure=${
        report.qualityScore.structureIntegrity === 1 ? "pass" : "fail"
      } semantic=${(report.qualityScore.semanticSimilarity * 100).toFixed(0)}% lexical=${(report.qualityScore.lexicalCompliance * 100).toFixed(0)}% judge=${report.outputJudge.blockingIssues.length === 0 ? "pass" : "fail"}`
    );

    // Write output
    await writeOutput(translated, options?.output);

    // Record to corpus if enabled
    if (options?.corpus) {
      try {
        const corpus = new TranslationCorpus();
        await corpus.append({
          source: content,
          translated,
          dialect: validatedDialect,
          provider: providerName,
          qualityScore: report.qualityScore.score,
          timestamp: new Date().toISOString(),
          accepted: report.valid,
        });
      } catch {
        // Corpus write failure should not block the command
      }
    }

    // Clean up checkpoint file after successful completion
    try {
      await fs.promises.unlink(checkpointPath);
    } catch {
      // Checkpoint file may not exist or already deleted — ignore
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeError(message);
    throw error;
  }
}
